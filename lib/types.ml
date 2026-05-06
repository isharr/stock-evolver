(* A single day of stock data from the CSV *)
type stock_day = {
  date : string;
  open_price : float;
  high : float;
  low : float;
  close : float;
  volume : int;
}
 
(* What action to take on a given day *)
type signal = Buy | Sell | Hold
 
(* How much cash and shares we currently hold *)
type portfolio = {
  cash : float;
  shares : float;
}
 
(* A trading rule expressed as a simple math expression.
   Example: GreaterThan (Price, MovingAverage 5)
   means "buy when today's price > 5-day moving average" *)
type expr =
  | Price
  | MovingAverage of int
  | GreaterThan of expr * expr
  | LessThan of expr * expr
 
(* A named strategy with a rule *)
type strategy = {
  name : string;
  rule : expr;
}
 
(* The result of running a strategy on historical data *)
type result = {
  strategy : strategy;
  final_value : float;
  profit : float;
}