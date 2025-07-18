"use client";
import React, { useRef, useState } from "react";
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
import { Upload, Sparkles, RotateCcw, Trash, FileText } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { withAuth } from "@/utils/withAuth";

const phaseSchema = z.object({
  name: z.string().min(1, "Phase name is required"),
  description: z.string().max(500).optional(),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Phase start time must be a valid date",
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Phase end time must be a valid date",
  }),
  tags: z.array(z.string()).optional(),
});

const createHackathonSchema = z.object({
  title: z.string().min(3, "Title must be at least 3 characters"),
  description: z
    .string()
    .max(1000, "Description must be under 1000 characters")
    .optional(),
  registrationStart: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Registration start time must be a valid date",
  }),
  registrationEnd: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Registration end time must be a valid date",
  }),
  startTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "Start time must be a valid date",
  }),
  endTime: z.string().refine((val) => !isNaN(Date.parse(val)), {
    message: "End time must be a valid date",
  }),
  tags: z.array(z.string()).optional(),
  minTeamSize: z.number().min(1, "Minimum team size must be at least 1"),
  maxTeamSize: z.number().min(1, "Maximum team size must be at least 1"),
  mode: z.enum(["online", "offline"]).optional(),
  phases: z.array(phaseSchema).optional(),
});

type HackathonForm = z.infer<typeof createHackathonSchema>;

function CreateHackathonPage() {
  const { user } = useAuth();
  const form = useForm<HackathonForm>({
    resolver: zodResolver(createHackathonSchema),
    defaultValues: {
      title: "",
      description: "",
      registrationStart: "",
      registrationEnd: "",
      startTime: "",
      endTime: "",
      minTeamSize: 1,
      maxTeamSize: 1,
      mode: "online",
      tags: [],
    },
  });
  const [poster, setPoster] = useState<File | null>(null);
  const [creatingHackathon, setCreatingHackathon] = useState(false);
  const posterInputRef = useRef<HTMLInputElement>(null);
  const { control, handleSubmit, watch, setValue } = form;
  const [newTag, setNewTag] = useState("");

  const { fields, append, remove } = useFieldArray({
    control,
    name: "phases",
  });

  const tags = watch("tags") || [];

  const handleAddTag = () => {
    const trimmedTag = newTag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      setValue("tags", [...tags, trimmedTag]);
      setNewTag("");
    }
  };

  const handleRemoveTag = (idx: number) => {
    setValue(
      "tags",
      tags.filter((_, i) => i !== idx)
    );
  };

  const onSubmit = async (data: HackathonForm) => {
    const phasesWithOrder = (data.phases || []).map((phase, idx) => ({
      ...phase,
      order: idx + 1,
    }));

    if (poster && poster.size > 3 * 1024 * 1024) {
      toast.error("File size exceeds 3MB limit. Please select a smaller file.");
      return;
    }

    const formData = new FormData();
    formData.append("title", data.title);
    formData.append("description", data.description || "");
    formData.append("registrationStart", data.registrationStart);
    formData.append("registrationEnd", data.registrationEnd);
    formData.append("startTime", data.startTime);
    formData.append("endTime", data.endTime);
    formData.append("tags", JSON.stringify(data.tags || []));
    formData.append("phases", JSON.stringify(phasesWithOrder));
    formData.append("minTeamSize", data.minTeamSize.toString());
    formData.append("maxTeamSize", data.maxTeamSize.toString());
    formData.append("mode", data.mode || "online");
    if (poster) formData.append("poster", poster);

    try {
      setCreatingHackathon(true);

      const res = await api.post("/hackathon/create-hackathon", formData, {
        headers: { "Content-Type": "multipart/form-data" },
      });

      const { status, data, message } = res.data;
      if (status === 201) {
        toast.success(message || "Hackathon created successfully!");
        form.reset();
        setPoster(null);
        if (posterInputRef.current) {
          posterInputRef.current.value = "";
        }
      }
    } catch (error: any) {
      toast.error(
        error?.response?.data?.message || "Failed to create hackathon"
      );
    } finally {
      setCreatingHackathon(false);
    }
  };

  const handleReset = () => {
    form.reset();
    setPoster(null);
    if (posterInputRef.current) {
      posterInputRef.current.value = "";
    }
    setNewTag("");
    form.setValue("phases", []);
  };

  return (
    <div className="max-w-2xl mx-auto py-8">
      <Form {...form}>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
          <div>
            <Button type="button" onClick={handleReset} variant="outline">
              Handle Reset
            </Button>
          </div>
          {/* Poster Upload + AI + Reset */}
          <div>
            <FormLabel className="mb-2 block">Poster</FormLabel>
            {/* File Info Box */}
            {poster && (
              <div className="flex items-center max-w-md justify-between text-gray-300 mb-4 bg-[#0A0A0A]/50 p-3 rounded-lg border border-yellow-400/10">
                {/* File Info */}
                <div className="flex items-center space-x-2">
                  <FileText className="h-5 w-5 text-yellow-400" />
                  <span className="text-sm">
                    Selected:{" "}
                    <span className="font-medium text-yellow-400">
                      {poster.name}
                    </span>
                  </span>
                  <button
                    title="Remove File"
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      setPoster(null);
                      if (posterInputRef.current) {
                        posterInputRef.current.value = "";
                      }
                    }}
                  >
                    <Trash
                      size={17}
                      className="text-white hover:text-gray-400 ml-auto cursor-pointer transition-all duration-200"
                    />
                  </button>
                </div>
              </div>
            )}

            {/* Hidden File Input */}
            <input
              type="file"
              id="poster-upload"
              accept="image/*"
              ref={posterInputRef}
              onChange={(e) => {
                const file = e.target.files?.[0];
                if (file && file.size > 3 * 1024 * 1024) {
                  toast.error(
                    "File size exceeds 3MB limit. Please select a smaller file."
                  );
                  return;
                }
                setPoster(file || null);
              }}
              className="hidden"
              disabled={form.formState.isSubmitting}
            />

            {/* Custom Upload Button */}
            <label
              htmlFor="poster-upload"
              className={`flex items-center gap-2 px-4 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 font-medium rounded-lg cursor-pointer transition-all duration-300 shadow ${
                form.formState.isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : ""
              }`}
              tabIndex={0}
            >
              <Upload className="h-5 w-5" />
              <span>{poster ? "Change Poster" : "Upload Poster"}</span>
            </label>
          </div>

          {/* Title */}
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

          {/* Description */}
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

          {/*Team Size*/}
          <FormField
            control={control}
            name="minTeamSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Minimum Team Size</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    placeholder="Minimum team size"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={control}
            name="maxTeamSize"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Maximum Team Size</FormLabel>
                <FormControl>
                  <Input
                    type="number"
                    {...field}
                    onChange={(e) => field.onChange(e.target.valueAsNumber)}
                    placeholder="Maximum team size"
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          {/* Mode Selection (shadcn checkbox) */}
          <div>
            <FormLabel className="mb-2 block">Mode</FormLabel>
            <div className="flex gap-6">
              <FormField
                control={control}
                name="mode"
                render={() => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={watch("mode") === "online"}
                        onCheckedChange={() => setValue("mode", "online")}
                        id="mode-online"
                      />
                    </FormControl>
                    <FormLabel htmlFor="mode-online" className="font-normal">
                      Online
                    </FormLabel>
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="mode"
                render={() => (
                  <FormItem className="flex flex-row items-center space-x-2">
                    <FormControl>
                      <Checkbox
                        checked={watch("mode") === "offline"}
                        onCheckedChange={() => setValue("mode", "offline")}
                        id="mode-offline"
                      />
                    </FormControl>
                    <FormLabel htmlFor="mode-offline" className="font-normal">
                      Offline
                    </FormLabel>
                  </FormItem>
                )}
              />
            </div>
          </div>

          {/* Start/End Time */}
          <div className="flex gap-4">
            <FormField
              control={control}
              name="registrationStart"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Registration Start</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <FormField
              control={control}
              name="registrationEnd"
              render={({ field }) => (
                <FormItem className="flex-1">
                  <FormLabel>Registration End</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

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

          {/* Phases */}
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
                {fields.length >= 1 && (
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

          {/* Tags */}
          <div>
            <FormLabel className="mb-2 block">Tags</FormLabel>
            <div className="flex flex-wrap gap-2 mb-2">
              {tags.map((tag, idx) => (
                <div
                  key={tag + idx}
                  className="flex items-center gap-1 bg-blue-100 border border-blue-300 rounded-md px-2 py-1"
                >
                  <span className="text-sm font-medium">{tag}</span>
                  <button
                    type="button"
                    onClick={() => handleRemoveTag(idx)}
                    className="text-red-500 hover:text-red-700 ml-1 text-lg font-bold"
                  >
                    ×
                  </button>
                </div>
              ))}
            </div>
            <div className="flex gap-2">
              <Input
                placeholder="Type a tag and press Enter"
                value={newTag}
                onChange={(e) => setNewTag(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddTag();
                  }
                }}
                className="flex-1"
              />
              <Button type="button" onClick={handleAddTag} variant="outline">
                Add
              </Button>
            </div>
          </div>

          {/* Submit */}
          <Button
            type="submit"
            className="w-full mt-4"
            disabled={creatingHackathon}
          >
            Create Hackathon
          </Button>
        </form>
      </Form>
    </div>
  );
}

export default withAuth(CreateHackathonPage, "organizer");
