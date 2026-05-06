(*
  Dream web server for stock_evolver.

  Endpoints:
    GET  /          -> health check
    POST /evolve    -> run the genetic algorithm, return top strategies as JSON
    POST /backtest  -> run one strategy, return trade history as JSON

  How to call:
    curl -X POST http://localhost:8080/evolve \
      -H "Content-Type: application/json" \
      -d '{"csv":"date,open,...\n...","gens":5,"pop":20,"cash":1000}'
*)

open Stock_evolver

(* --- Simple JSON helpers --- *)

let json_str s =
  let s = String.concat "\\\"" (String.split_on_char '"' s) in
  Printf.sprintf {|"%s"|} s

let json_float f = Printf.sprintf "%.2f" f
let json_int i   = string_of_int i

let json_obj pairs =
  let fields = List.map (fun (k, v) -> Printf.sprintf {|"%s": %s|} k v) pairs in
  "{ " ^ String.concat ", " fields ^ " }"

let json_array items =
  "[ " ^ String.concat ", " items ^ " ]"

let string_of_signal = function
  | Types.Buy  -> "buy"
  | Types.Sell -> "sell"
  | Types.Hold -> "hold"

(* --- Tiny JSON field extractor --- *)
(* Not a full JSON parser - just enough to pull fields from our flat objects *)

let get_json_string body key =
  (* Try with space and without space after colon *)
  let patterns = [
    Printf.sprintf {|"%s": "|} key;
    Printf.sprintf {|"%s":"|} key;
  ] in
  let try_pattern pattern =
    try
      let klen = String.length pattern in
      let blen = String.length body in
      let rec find i =
        if i + klen > blen then None
        else if String.sub body i klen = pattern then
          let start = i + klen in
          let rec grab j acc =
            if j >= blen then String.concat "" (List.rev acc)
            else if body.[j] = '\\' && j + 1 < blen && body.[j+1] = '"' then
              grab (j + 2) ("\"" :: acc)
            else if body.[j] = '"' then String.concat "" (List.rev acc)
            else grab (j + 1) (String.make 1 body.[j] :: acc)
          in
          Some (grab start [])
        else find (i + 1)
      in
      find 0
    with _ -> None
  in
  List.find_map try_pattern patterns

let get_json_number body key =
  let patterns = [
    Printf.sprintf {|"%s": |} key;
    Printf.sprintf {|"%s":|} key;
  ] in
  let try_pattern pattern =
    try
      let klen = String.length pattern in
      let blen = String.length body in
      let rec find i =
        if i + klen > blen then None
        else if String.sub body i klen = pattern then
          let start = i + klen in
          let rec grab j acc =
            if j >= blen then String.concat "" (List.rev acc)
            else match body.[j] with
              | '0'..'9' | '.' | '-' -> grab (j+1) (String.make 1 body.[j] :: acc)
              | _ -> String.concat "" (List.rev acc)
          in
          Some (grab start [])
        else find (i + 1)
      in
      find 0
    with _ -> None
  in
  List.find_map try_pattern patterns

(* Replace \n in JSON string with actual newlines *)
let unescape_newlines s =
  let buf = Buffer.create (String.length s) in
  let len = String.length s in
  let rec loop i =
    if i >= len then ()
    else if s.[i] = '\\' && i + 1 < len && s.[i+1] = 'n' then begin
      Buffer.add_char buf '\n';
      loop (i + 2)
    end else begin
      Buffer.add_char buf s.[i];
      loop (i + 1)
    end
  in
  loop 0;
  Buffer.contents buf

(* --- Route handlers --- *)

let handle_health _req =
  Dream.respond ~headers:[("Content-Type", "application/json")]
    {|{ "status": "ok", "message": "stock_evolver is running" }|}

let handle_evolve req =
  let%lwt body = Dream.body req in
  let csv_raw      = get_json_string body "csv" |> Option.value ~default:"" in
  let csv          = unescape_newlines csv_raw in
  let generations  = get_json_number body "gens" |> Option.value ~default:"10"
                     |> int_of_string_opt |> Option.value ~default:10 in
  let pop_size     = get_json_number body "pop" |> Option.value ~default:"20"
                     |> int_of_string_opt |> Option.value ~default:20 in
  let initial_cash = get_json_number body "cash" |> Option.value ~default:"1000"
                     |> float_of_string_opt |> Option.value ~default:1000.0 in
  if csv = "" then
    Dream.respond ~status:`Bad_Request {|{ "error": "no csv provided" }|}
  else begin
    let data = Csv_loader.load_stock_data_from_string csv in
    if List.length data = 0 then
      Dream.respond ~status:`Bad_Request {|{ "error": "CSV parsed 0 rows" }|}
    else begin
      let top5 = Evolution.evolve data initial_cash generations pop_size in
      let result_jsons =
        List.mapi (fun i r ->
          json_obj [
            ("rank",        json_int (i + 1));
            ("rule",        json_str (Evolution.string_of_expr r.Types.strategy.Types.rule));
            ("profit",      json_float r.Types.profit);
            ("final_value", json_float r.Types.final_value);
          ]
        ) top5
      in
      let resp = json_obj [
        ("days_loaded", json_int (List.length data));
        ("generations", json_int generations);
        ("results",     json_array result_jsons);
      ] in
      Dream.respond ~headers:[("Content-Type", "application/json")] resp
    end
  end

let handle_backtest req =
  let%lwt body = Dream.body req in
  let csv_raw      = get_json_string body "csv" |> Option.value ~default:"" in
  let csv          = unescape_newlines csv_raw in
  let rule_name    = get_json_string body "rule" |> Option.value ~default:"price_gt_ma3" in
  let initial_cash = get_json_number body "cash" |> Option.value ~default:"1000"
                     |> float_of_string_opt |> Option.value ~default:1000.0 in
  if csv = "" then
    Dream.respond ~status:`Bad_Request {|{ "error": "no csv provided" }|}
  else begin
    let data = Csv_loader.load_stock_data_from_string csv in
    let rule =
      match rule_name with
      | "price_gt_ma3" -> Types.GreaterThan (Types.Price, Types.MovingAverage 3)
      | "price_lt_ma3" -> Types.LessThan    (Types.Price, Types.MovingAverage 3)
      | "price_gt_ma5" -> Types.GreaterThan (Types.Price, Types.MovingAverage 5)
      | "price_lt_ma5" -> Types.LessThan    (Types.Price, Types.MovingAverage 5)
      | _              -> Types.GreaterThan (Types.Price, Types.MovingAverage 3)
    in
    let strategy = { Types.name = rule_name; Types.rule } in
    let (final_value, history) =
      Backtest.backtest_with_history strategy data initial_cash
    in
    let history_jsons =
      List.map (fun (day, signal) ->
        json_obj [
          ("date",   json_str day.Types.date);
          ("close",  json_float day.Types.close);
          ("signal", json_str (string_of_signal signal));
        ]
      ) history
    in
    let resp = json_obj [
      ("days_loaded", json_int (List.length data));
      ("final_value", json_float final_value);
      ("profit",      json_float (final_value -. initial_cash));
      ("history",     json_array history_jsons);
    ] in
    Dream.respond ~headers:[("Content-Type", "application/json")] resp
  end

let () =
  Dream.run ~port:8080
@@ Dream.logger
@@ (fun handler req ->
  let%lwt response = handler req in
  Dream.add_header response "Access-Control-Allow-Origin" "*";
  Dream.add_header response "Access-Control-Allow-Methods" "GET, POST, OPTIONS";
  Dream.add_header response "Access-Control-Allow-Headers" "Content-Type";
  Lwt.return response)
@@ Dream.router [
  Dream.get  "/"         handle_health;
  Dream.post "/evolve"   handle_evolve;
  Dream.post "/backtest" handle_backtest;
  Dream.options "/evolve"   (fun _ -> Dream.respond ~status:`No_Content "");
  Dream.options "/backtest" (fun _ -> Dream.respond ~status:`No_Content "");
]