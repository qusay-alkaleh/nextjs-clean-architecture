"use server";

import { SESSION_COOKIE } from "@/config";
import { UnauthenticatedError } from "@/src/entities/errors/auth";
import { InputParseError } from "@/src/entities/errors/common";
import { createTodoController } from "@/src/interface-adapters/controllers/todos/create-todo.controller";
import {
  captureException,
  withServerActionInstrumentation,
} from "@sentry/nextjs";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";

export async function createTodo(formData: FormData) {
  return await withServerActionInstrumentation(
    "createTodo",
    { recordResponse: true },
    async () => {
      try {
        const data = Object.fromEntries(formData.entries());
        const sessioId = cookies().get(SESSION_COOKIE)?.value;
        await createTodoController(data, sessioId);
      } catch (err) {
        if (err instanceof InputParseError) return { error: err.message };
        if (err instanceof UnauthenticatedError)
          return { error: "Must be logged in to create a todo" };

        captureException(err);
        return {
          error:
            "An error happend while creating a todo. The developers have been notified.",
        };
      }

      // return the user to home page if there no error occure
      revalidatePath("/");
      return { success: true };
    }
  );
}
