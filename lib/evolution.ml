open Types
open Backtest

let rec string_of_expr expr =
  match expr with
  | Price              -> "Price"
  | MovingAverage n    -> "MA(" ^ string_of_int n ^ ")"
  | GreaterThan (a, b) -> "(" ^ string_of_expr a ^ " > " ^ string_of_expr b ^ ")"
  | LessThan (a, b)    -> "(" ^ string_of_expr a ^ " < " ^ string_of_expr b ^ ")"

(* All the window sizes we try *)
let windows = [| 2; 3; 4; 5; 8; 10; 15; 20 |]

let random_window () =
  windows.(Random.int (Array.length windows))

let random_number_expr () =
  if Random.bool () then Price
  else MovingAverage (random_window ())

let random_rule () =
  let a = random_number_expr () in
  let b = random_number_expr () in
  if Random.bool () then GreaterThan (a, b) else LessThan (a, b)

let random_strategy id =
  { name = "S" ^ string_of_int id; rule = random_rule () }

let generate_population n =
  List.init n (fun i -> random_strategy (i + 1))

(* Mutate — 50% chance of full random replacement keeps diversity high *)
let mutate_strategy id s =
  let new_rule =
    if Random.int 2 = 0 then
      (* full random replacement *)
      random_rule ()
    else begin
      (* small tweak to existing rule *)
      match s.rule with
      | GreaterThan (a, b) ->
          (match Random.int 3 with
           | 0 -> GreaterThan (random_number_expr (), b)
           | 1 -> GreaterThan (a, random_number_expr ())
           | _ -> LessThan (a, b))
      | LessThan (a, b) ->
          (match Random.int 3 with
           | 0 -> LessThan (random_number_expr (), b)
           | 1 -> LessThan (a, random_number_expr ())
           | _ -> GreaterThan (a, b))
      | e -> e
    end
  in
  { name = "S" ^ string_of_int id; rule = new_rule }

let evaluate data initial_cash strategy =
  let final_value = backtest_strategy strategy data initial_cash in
  { strategy; final_value; profit = final_value -. initial_cash }

let compare_results a b = compare b.profit a.profit

let evolve data initial_cash generations pop_size =
  let rec loop gen population =
    let results =
      population
      |> List.map (evaluate data initial_cash)
      |> List.sort compare_results
    in
    let top5 = List.filteri (fun i _ -> i < 5) results in

    Printf.printf "\nGen %d best: $%.2f  rule: %s\n" gen
      (List.hd top5).profit
      (string_of_expr (List.hd top5).strategy.Types.rule);

    if gen >= generations then top5
    else begin
      let parents = List.map (fun r -> r.strategy) top5 in
      (* Keep top 5, fill rest with mutated children *)
      let children = List.init (pop_size - 5) (fun i ->
        let parent = List.nth parents (i mod 5) in
        mutate_strategy (i + 6) parent)
      in
      loop (gen + 1) (parents @ children)
    end
  in
  loop 1 (generate_population pop_size)