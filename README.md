StockEvolver

A full-stack stock analysis app built with OCaml + Dream on the backend and React on the frontend.

The Story

This semester I learned OCaml in class. While studying it I got curious about where it actually gets used in the real world — turns out OCaml is huge in finance. Jane Street, Bloomberg, and a bunch of trading firms use it for performance-critical systems. That got me thinking.

Instead of just doing textbook exercises to prepare for my exam, I decided to build something real with it. I figured if I could actually apply the concepts — recursion, pattern matching, algebraic data types, functional programming — in a project, I'd understand them way better than just reading notes.

So during exams I started StockEvolver.

How it evolved

Iteration 1 — basic CSV parser and a backtest engine. Load stock data, simulate a simple buy/sell rule, see the profit. Mostly just getting OCaml to do something real.

Iteration 2 — added a genetic algorithm. Instead of hardcoding one trading rule, the program generates hundreds of random rules, backtests all of them, keeps the best ones, mutates them, and repeats. Essentially evolution applied to trading strategies.

Iteration 3 — added a Dream HTTP server so the algorithm could be called from a frontend. This is where it became a full stack app.

Final version — React frontend with live Yahoo Finance data. Type any ticker, get a real buy/sell/hold recommendation based on RSI, moving averages, and 6-month trend. Plus you can run the genetic algorithm on real stock data and see what strategies it evolves.

What it does

Live stock data from Yahoo Finance — just type a ticker
Buy / Sell / Hold recommendation with a confidence meter
Plain English explanations of every signal — built for people with zero finance knowledge
6-month price chart with MA20 and MA50 overlaid
Genetic algorithm that evolves trading strategies on real historical data
Supports custom CSV upload for your own stock data
Tech stack

Layer	Tech
Backend	OCaml + Dream
Algorithm	Genetic algorithm written in OCaml
Frontend	React + Vite
Charts	Recharts
Stock data	Yahoo Finance API
OCaml concepts used

Algebraic data types (type expr = Price | MovingAverage of int | ...)
Pattern matching throughout the evaluator and mutation logic
Recursive functions for backtest simulation and tree evaluation
Higher order functions (List.map, List.fold_left, List.filter)
Modules and separate compilation with Dune
Running locally

Backend:

opam install dream

dune build

dune exec bin/main.exe

# runs at http://localhost:8080
Frontend:

cd frontend

npm install

npm run dev

# runs at http://localhost:5173
Disclaimer

Built as a learning project during exam prep. Not financial advice.

## Note on the Evolution feature
The genetic algorithm requires the OCaml backend running locally.
The live demo at stock-evolver.vercel.app shows all features except
the "Run Evolution" button — clone the repo and run the backend to
enable it.
