import { z } from "zod";

export const categoryFormSchema = z.object({
  name: z.string().min(2, "Category name must be at least 2 characters."),
  description: z.string().optional(),
});

export type CategoryFormValues = z.infer<typeof categoryFormSchema>;

export const defaultCategoryFormValues: CategoryFormValues = {
  name: "",
  description: "",
};
