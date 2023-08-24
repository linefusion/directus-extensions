import { ok, err, Result } from "@wolfpkgs/core/results";
import { Guards } from "@wolfpkgs/core/results/utils";

import jsonata from "jsonata";
import memoizee from "memoizee";

import { Data } from "./bindings";
import { Errors } from "@wolfpkgs/core/errors";

import { P } from "ts-pattern";

Guards.inject(P);

export class InvalidTemplate extends Errors.id("invalid_template")
  .for<InvalidTemplate>()
  .context<{
    template: string;
    error: string;
  }>()
  .message((ctx) => ctx.error.toString())
  .create() {}

export class EvaluationError extends Errors.id("evaluation_error")
  .for<InvalidTemplate>()
  .context<{
    template: string;
    data: Data;
    bindings: Data;
    message: string;
    error: string;
  }>()
  .message((ctx) => ctx.error.toString())
  .create() {}

export const getEvaluator = Result.wrap((template: string) => {
  try {
    return ok(jsonata(template));
  } catch (e) {
    return err(InvalidTemplate, {
      template,
      error: e.message,
    });
  }
});

export const isTemplate = (template: string): template is string => {
  if (typeof template !== "string") {
    return false;
  }
  template = template.trim();
  return template.startsWith("$(") && template.endsWith(")");
};

export const cleanupTemplate = (template: string): string | undefined => {
  if (!isTemplate(template)) {
    return undefined;
  }
  return template.substring(1);
};

export const evaluate = Result.wrap(
  async (template: string, data: Data, bindings: Data) => {
    if (!isTemplate(template)) {
      return err(InvalidTemplate, {
        template,
        error: 'Template is not a "$()" string',
      });
    }

    const evaluator = getEvaluator(cleanupTemplate(template)!);
    if (evaluator.is_err()) {
      return err(evaluator.err());
    }

    try {
      const result = await evaluator.ok().evaluate(data, bindings);
      return ok(result);
    } catch (e) {
      return err(e);
    }
  }
);
