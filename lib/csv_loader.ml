open Types
 
(* Split a CSV line like "2024-01-01,100,105,98,102,100000"
   into a list of strings *)
let split_by_comma line =
  String.split_on_char ',' line
 
(* Try to parse one line into a stock_day.
   Returns None if the line is malformed. *)
let parse_stock_day line =
  match split_by_comma line with
  | [date; open_price; high; low; close; volume] ->
      Some {
        date;
        open_price = float_of_string open_price;
        high       = float_of_string high;
        low        = float_of_string low;
        close      = float_of_string close;
        volume     = int_of_string (String.trim volume);
      }
  | _ -> None
 
(* Read every line of a file into a list *)
let read_lines filename =
  let channel = open_in filename in
  let rec loop acc =
    try
      let line = input_line channel in
      loop (line :: acc)
    with End_of_file ->
      close_in channel;
      List.rev acc
  in
  loop []
 
(* Load a CSV file. Skips the header row and any bad lines. *)
let load_stock_data filename =
  match read_lines filename with
  | [] -> []
  | _header :: rows ->
      List.filter_map parse_stock_day rows
 
(* Parse CSV content from a string (used by the web server
   so we don't need to write the file to disk first) *)
let load_stock_data_from_string content =
  match String.split_on_char '\n' content with
  | [] -> []
  | _header :: rows ->
      List.filter_map (fun row ->
        let row = String.trim row in
        if row = "" then None
        else parse_stock_day row
      ) rows