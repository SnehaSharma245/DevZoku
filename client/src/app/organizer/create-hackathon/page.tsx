// filepath: [page.tsx](http://_vscodecontentref_/1)
"use client";
import React from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input, Textarea, Button } from "@/components/index";
import api from "@/utils/api";
import { toast } from "sonner";

const phaseSchema = z.object({
  name: z.string().min(1, "Phase name is required"),
  description: z.string().max(500).optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Phase start time must be a valid date",
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Phase end time must be a valid date",
  }),
});

const createHackathonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z
    .string()
    .max(1000, "Description must be under 1000 characters")
    .optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Start time must be a valid date",
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "End time must be a valid date",
  }),
  phases: z.array(phaseSchema).optional(),
});

type HackathonForm = z.infer<typeof createHackathonSchema>;

export default function CreateHackathonPage() {
  const form = useForm<HackathonForm>({
    resolver: zodResolver(createHackathonSchema),
    defaultValues: {
      title: "",
      description: "",
      startTime: "",
      endTime: "",
    },
  });

  const { control, handleSubmit } = form;

  const { fields, append, remove } = useFieldArray({
    control,
    name: "phases",
  });

  const onSubmit = async (data: HackathonForm) => {
    const phasesWithOrder = (data.phases || []).map((phase, idx) => ({
      ...phase,
      order: idx + 1,
    }));

    const payload = {
      ...data,
      phases: phasesWithOrder,
    };

    try {
      const res = await api.post("/organizer/create-hackathon", payload);
      toast.success(
        res?.data?.data?.message || "Hackathon created successfully!"
      );
      // form.reset();
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create hackathon"
      );
    }
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <FormField
            control={control}
            name="title"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Title</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Hackathon title" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Description</FormLabel>
                <FormControl>
                  <Textarea {...field} placeholder="Hackathon description" />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <div className="flex gap-4">
            <FormField
              control={control}
              name="startTime"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Start Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="endTime"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>End Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>
          <div>
            <FormLabel className="mb-2 block">Phases</FormLabel>
            {fields.map((field, idx) => (
              <div
                key={field.id}
                className="border p-4 mb-4 rounded relative bg-gray-50"
              >
                <div className="flex gap-4">
                  <FormField
                    control={control}
                    name={`phases.${idx}.name`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Phase Name</FormLabel>
                        <FormControl>
                          <Input {...field} placeholder="Phase name" />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`phases.${idx}.startTime`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>Start Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  <FormField
                    control={control}
                    name={`phases.${idx}.endTime`}
                    render={({ field }) => (
                      <FormItem className="flex-1">
                        <FormLabel>End Time</FormLabel>
                        <FormControl>
                          <Input type="datetime-local" {...field} />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <FormField
                  control={control}
                  name={`phases.${idx}.description`}
                  render={({ field }) => (
                    <FormItem className="mt-2">
                      <FormLabel>Description</FormLabel>
                      <FormControl>
                        <Textarea {...field} placeholder="Phase description" />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                {fields.length > 1 && (
                  <button
                    type="button"
                    onClick={() => remove(idx)}
                    className="absolute top-2 right-2 text-red-500"
                    title="Remove phase"
                  >
                    ✕
                  </button>
                )}
              </div>
            ))}
            <Button
              type="button"
              onClick={() =>
                append({
                  name: "",
                  description: "",
                  startTime: "",
                  endTime: "",
                })
              }
              className="px-3 py-1 mt-2"
            >
              + Add Phase
            </Button>
          </div>
          <Button type="submit" className="w-full mt-4">
            Create Hackathon
          </Button>
        </form>
      </Form>
    </div>
  );
}
