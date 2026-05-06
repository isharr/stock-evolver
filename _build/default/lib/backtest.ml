open Types
 
(* Take the first n items from a list *)
let take n lst =
  let rec loop n lst acc =
    if n = 0 then List.rev acc
    else
      match lst with
      | [] -> List.rev acc
      | x :: xs -> loop (n - 1) xs (x :: acc)
  in
  loop n lst []
 
(* Average of a float list *)
let average numbers =
  let total = List.fold_left ( +. ) 0.0 numbers in
  total /. float_of_int (List.length numbers)
 
(* Moving average of the last `window` closing prices.
   Returns None if we don't have enough data yet. *)
let moving_average_value days window =
  let closes = List.map (fun d -> d.close) days in
  if List.length closes < window then None
  else Some (average (take window closes))
 
(* Evaluate a numeric expression given recent days of data *)
let eval_number expr recent_days =
  match expr with
  | Price ->
      (match recent_days with
       | d :: _ -> Some d.close
       | []     -> None)
  | MovingAverage n ->
      moving_average_value recent_days n
  | _ -> None
 
(* Evaluate a boolean expression (GreaterThan / LessThan) *)
let eval_bool expr recent_days =
  match expr with
  | GreaterThan (a, b) ->
      (match eval_number a recent_days, eval_number b recent_days with
       | Some x, Some y -> Some (x > y)
       | _              -> None)
  | LessThan (a, b) ->
      (match eval_number a recent_days, eval_number b recent_days with
       | Some x, Some y -> Some (x < y)
       | _              -> None)
  | _ -> None
 
(* Turn a rule into a Buy/Sell/Hold signal for today *)
let signal_from_rule rule recent_days =
  match eval_bool rule recent_days with
  | Some true  -> Buy
  | Some false -> Sell
  | None       -> Hold
 
(* Generate a signal for every day in the dataset *)
let generate_signals strategy data =
  let rec loop remaining history acc =
    match remaining with
    | [] -> List.rev acc
    | day :: rest ->
        let history = day :: history in
        let signal  = signal_from_rule strategy.rule history in
        loop rest history ((day, signal) :: acc)
  in
  loop data [] []
 
(* Execute one trade: buy all-in, sell everything, or hold *)
let execute_trade portfolio price signal =
  match signal with
  | Buy  ->
      if portfolio.cash > 0.0 then
        { cash = 0.0; shares = portfolio.shares +. (portfolio.cash /. price) }
      else portfolio
  | Sell ->
      if portfolio.shares > 0.0 then
        { cash = portfolio.cash +. (portfolio.shares *. price); shares = 0.0 }
      else portfolio
  | Hold -> portfolio
 
(* Total value of portfolio at a given price *)
let portfolio_value p price =
  p.cash +. (p.shares *. price)
 
(* Last closing price in the dataset *)
let final_price data =
  match List.rev data with
  | []      -> 0.0
  | d :: _  -> d.close
 
(* Run a strategy on data starting with initial_cash.
   Returns the final portfolio value. *)
let backtest_strategy strategy data initial_cash =
  let signals   = generate_signals strategy data in
  let start     = { cash = initial_cash; shares = 0.0 } in
  let final_p   =
    List.fold_left
      (fun p (day, signal) -> execute_trade p day.close signal)
      start
      signals
  in
  portfolio_value final_p (final_price data)
 
(* Same as backtest_strategy but also returns every (day, signal)
   pair so the frontend can chart the trades *)
let backtest_with_history strategy data initial_cash =
  let signals = generate_signals strategy data in
  let start   = { cash = initial_cash; shares = 0.0 } in
  let final_p =
    List.fold_left
      (fun p (day, signal) -> execute_trade p day.close signal)
      start
      signals
  in
  let final_val = portfolio_value final_p (final_price data) in
  (final_val, signals)