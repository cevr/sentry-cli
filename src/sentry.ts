#!/usr/bin/env bun
import { BunRuntime } from "@effect/platform-bun"
import { Effect } from "effect"
import { runCli } from "./main.js"

const main = Effect.suspend(() => runCli(process.argv))

BunRuntime.runMain(main)
