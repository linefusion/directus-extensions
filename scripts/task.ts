import { Command } from "jsr:@cliffy/command@1.0.0-rc.4";
import $ from "jsr:@david/dax";

export type TaskFunction<T> = (...args: string[]) => Promise<T>;

const tasks = new Command();

const commands = await Array.fromAsync(
  $.path(import.meta.dirname!).expandGlob("**/task-*.ts")
);

for (const command of commands) {
  const task: TaskFunction<unknown> = await import(
    command.path.toFileUrl().toString()
  );
  if (typeof task !== "function") {
    throw new Error(`Task default export "${command.name}" is not a function.`);
  }

  tasks.command(command.name, (task));
}

export default tasks;

if (import.meta.main) {
  await tasks.parse(Deno.args);
}
