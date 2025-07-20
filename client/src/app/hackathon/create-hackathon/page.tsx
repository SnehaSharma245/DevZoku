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
import { useRouter } from "next/navigation";

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
  const [descCharCount, setDescCharCount] = useState(0);
  const router = useRouter();

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
        router.push(`/hackathon/view-all-hackathons/${data.id}`);
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
    <div className="min-h-screen w-full flex items-center justify-center pb-16 bg-[#18181e]">
      <div className="max-w-2xl w-full mx-auto py-10 px-4">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-white tracking-tight">
          Create Hackathon
        </h1>
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8 bg-[#18181e] rounded-3xl shadow-xl p-8 border border-[#23232b]"
          >
            {/* Reset Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleReset}
                variant="outline"
                className="bg-[#23232b] text-white border-none rounded-xl hover:bg-[#23232b]/80 transition"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>
            {/* Poster Upload + AI + Reset */}
            <div>
              <FormLabel className="mb-2 block text-white font-semibold">
                Poster
              </FormLabel>
              {/* File Info Box */}
              {poster && (
                <div className="flex items-center max-w-md justify-between text-gray-300 mb-4 bg-[#23232b] p-3 rounded-lg border border-[#a3e635]/10">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-[#a3e635]" />
                    <span className="text-sm">
                      Selected:{" "}
                      <span className="font-medium text-[#a3e635]">
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
                className={`flex items-center gap-2 px-4 py-2 bg-[#a3e635] hover:bg-lime-400 text-gray-900 font-medium rounded-lg cursor-pointer transition-all duration-300 shadow ${
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
                  <FormLabel className="text-white font-semibold">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Hackathon title"
                      className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
                    />
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
                  <div className="flex justify-between items-center">
                    <FormLabel className="text-white font-semibold">
                      Description
                    </FormLabel>
                    <span className="text-xs text-gray-400">
                      {descCharCount}/250
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Hackathon description"
                      className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888] resize-none"
                      rows={3}
                      maxLength={250}
                      onChange={(e) => {
                        field.onChange(e);
                        setDescCharCount(e.target.value.length);
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Team Size */}
            <div className="flex gap-4">
              <FormField
                control={control}
                name="minTeamSize"
                render={({ field }) => (
                  <FormItem className="flex-1">
                    <FormLabel className="text-white font-semibold">
                      Min Team Size
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        placeholder="Minimum team size"
                        className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
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
                  <FormItem className="flex-1">
                    <FormLabel className="text-white font-semibold">
                      Max Team Size
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        placeholder="Maximum team size"
                        className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Mode Selection */}
            <div>
              <FormLabel className="mb-2 block text-white font-semibold">
                Mode
              </FormLabel>
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
                          className="border-[#a3e635] data-[state=checked]:bg-[#a3e635]"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="mode-online"
                        className="font-normal text-white"
                      >
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
                          className="border-[#a3e635] data-[state=checked]:bg-[#a3e635]"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="mode-offline"
                        className="font-normal text-white"
                      >
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
                    <FormLabel className="text-white font-semibold">
                      Registration Start
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635]"
                      />
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
                    <FormLabel className="text-white font-semibold">
                      Registration End
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635]"
                      />
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
                    <FormLabel className="text-white font-semibold">
                      Start Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635]"
                      />
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
                    <FormLabel className="text-white font-semibold">
                      End Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phases */}
            <div>
              <FormLabel className="mb-2 block text-white font-semibold">
                Phases
              </FormLabel>
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="border border-[#a3e635]/10 p-4 mb-4 rounded-2xl relative bg-[#23232b]"
                >
                  <div className="flex gap-4">
                    <FormField
                      control={control}
                      name={`phases.${idx}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-white font-semibold">
                            Phase Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Phase name"
                              className="bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
                            />
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
                          <FormLabel className="text-white font-semibold">
                            Start Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              className="bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635]"
                            />
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
                          <FormLabel className="text-white font-semibold">
                            End Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              className="bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635]"
                            />
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
                        <FormLabel className="text-white font-semibold">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Phase description"
                            className="bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888] resize-none"
                            rows={2}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {fields.length >= 1 && (
                    <button
                      type="button"
                      onClick={() => remove(idx)}
                      className="absolute top-2 right-2 text-red-400 hover:text-red-600 bg-[#18181e] rounded-full p-1"
                      title="Remove phase"
                    >
                      <Trash size={16} />
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
                className="px-3 py-1 mt-2 bg-[#a3e635] text-black font-semibold rounded-xl hover:bg-lime-400 transition"
              >
                + Add Phase
              </Button>
            </div>

            {/* Tags */}
            <div>
              <FormLabel className="mb-2 block text-white font-semibold">
                Tags
              </FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, idx) => (
                  <span
                    key={tag + idx}
                    className="flex items-center bg-[#23232b] text-white px-3 py-1 rounded-full text-sm border border-blue-400"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="ml-2 text-gray-400 hover:text-red-400"
                      tabIndex={-1}
                    >
                      <Trash size={14} />
                    </button>
                  </span>
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
                  className="flex-1 bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
                />
                <Button
                  type="button"
                  onClick={handleAddTag}
                  variant="outline"
                  className="bg-[#23232b] text-white border-none rounded-xl hover:bg-[#23232b]/80 transition"
                >
                  Add
                </Button>
              </div>
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-[#a3e635] text-black font-bold rounded-xl hover:bg-lime-400 transition mt-4"
              disabled={creatingHackathon}
            >
              {creatingHackathon ? "Creating..." : "Create Hackathon"}
            </Button>
          </form>
        </Form>
      </div>
    </div>
  );
}

export default withAuth(CreateHackathonPage, "organizer");
