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
import { Upload, RotateCcw, Trash, FileText, ChevronDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { useAuth } from "@/hooks/useAuth";
import { withAuth } from "@/utils/withAuth";
import { useRouter } from "next/navigation";
import { tagSections } from "@/constants/const";
import { Separator } from "@/components/ui/separator";

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
  const [tagDropdownOpen, setTagDropdownOpen] = useState(false);
  const router = useRouter();

  const { fields, append, remove } = useFieldArray({
    control,
    name: "phases",
  });

  const tags = watch("tags") || [];

  const handleRemoveTag = (idx: number) => {
    setValue(
      "tags",
      tags.filter((_, i) => i !== idx)
    );
  };

  // Tag selection dropdown handler
  const handleSelectTag = (tag: string) => {
    if (!tags.includes(tag)) {
      setValue("tags", [...tags, tag]);
    }
    setTagDropdownOpen(false);
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
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-2xl w-full mx-auto py-10">
        <div className="text-center space-y-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#062a47] leading-tight mt-3">
            Create Hackathon
          </h1>
        </div>
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-8 bg-gradient-to-br from-white via-white to-[#fff9f5] rounded-3xl shadow-2xl p-8 border border-[#e3e8ee]"
          >
            {/* Reset Button */}
            <div className="flex justify-end">
              <Button
                type="button"
                onClick={handleReset}
                variant="outline"
                className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl hover:bg-[#eaf6fb] transition"
              >
                <RotateCcw className="w-4 h-4 mr-2" />
                Reset
              </Button>
            </div>

            {/* Poster Upload */}
            <div>
              <FormLabel className="mb-2 block text-[#062a47] font-semibold">
                Poster
              </FormLabel>
              {/* File Info Box */}
              {poster && (
                <div className="flex items-center max-w-md justify-between text-[#6B7A8F] mb-4 bg-[#eaf6fb] p-3 rounded-lg border border-[#e3e8ee]">
                  <div className="flex items-center space-x-2">
                    <FileText className="h-5 w-5 text-[#f75a2f]" />
                    <span className="text-sm">
                      Selected:{" "}
                      <span className="font-medium text-[#f75a2f]">
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
                        className="text-[#6B7A8F] hover:text-[#f75a2f] ml-auto cursor-pointer transition-all duration-200"
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
                className={`flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-[#FF9466] to-[#FF6F61] hover:from-[#FF8456] hover:to-[#FF5F51] text-white font-medium rounded-lg cursor-pointer transition-all duration-300 shadow ${
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
                  <FormLabel className="text-[#062a47] font-semibold">
                    Title
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Hackathon title"
                      className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
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
                    <FormLabel className="text-[#062a47] font-semibold">
                      Description
                    </FormLabel>
                    <span className="text-xs text-[#6B7A8F]">
                      {descCharCount}/250
                    </span>
                  </div>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Hackathon description"
                      className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] resize-none transition"
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
                    <FormLabel className="text-[#062a47] font-semibold">
                      Min Team Size
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        placeholder="Minimum team size"
                        className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
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
                    <FormLabel className="text-[#062a47] font-semibold">
                      Max Team Size
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        {...field}
                        onChange={(e) => field.onChange(e.target.valueAsNumber)}
                        placeholder="Maximum team size"
                        className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Mode Selection */}
            <div>
              <FormLabel className="mb-2 block text-[#062a47] font-semibold">
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
                          className="border-[#f75a2f] data-[state=checked]:bg-[#f75a2f] data-[state=checked]:border-[#f75a2f]"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="mode-online"
                        className="font-normal text-[#062a47]"
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
                          className="border-[#f75a2f] data-[state=checked]:bg-[#f75a2f] data-[state=checked]:border-[#f75a2f]"
                        />
                      </FormControl>
                      <FormLabel
                        htmlFor="mode-offline"
                        className="font-normal text-[#062a47]"
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
                    <FormLabel className="text-[#062a47] font-semibold">
                      Registration Start
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] transition"
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
                    <FormLabel className="text-[#062a47] font-semibold">
                      Registration End
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] transition"
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
                    <FormLabel className="text-[#062a47] font-semibold">
                      Start Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] transition"
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
                    <FormLabel className="text-[#062a47] font-semibold">
                      End Time
                    </FormLabel>
                    <FormControl>
                      <Input
                        type="datetime-local"
                        {...field}
                        className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] transition"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Phases */}
            <div>
              <FormLabel className="mb-2 block text-[#062a47] font-semibold">
                Phases
              </FormLabel>
              {fields.map((field, idx) => (
                <div
                  key={field.id}
                  className="border border-[#e3e8ee] p-4 mb-4 rounded-2xl relative bg-gradient-to-br from-white via-white to-[#fff9f5]"
                >
                  <div className="flex gap-4">
                    <FormField
                      control={control}
                      name={`phases.${idx}.name`}
                      render={({ field }) => (
                        <FormItem className="flex-1">
                          <FormLabel className="text-[#062a47] font-semibold">
                            Phase Name
                          </FormLabel>
                          <FormControl>
                            <Input
                              {...field}
                              placeholder="Phase name"
                              className="bg-gradient-to-br from-white via-white to-[#fff9f5] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
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
                          <FormLabel className="text-[#062a47] font-semibold">
                            Start Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] transition"
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
                          <FormLabel className="text-[#062a47] font-semibold">
                            End Time
                          </FormLabel>
                          <FormControl>
                            <Input
                              type="datetime-local"
                              {...field}
                              className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] transition"
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
                        <FormLabel className="text-[#062a47] font-semibold">
                          Description
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Phase description"
                            className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] resize-none transition"
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
                      className="absolute top-2 right-2 text-[#f75a2f] hover:text-[#FF5F51] bg-[#f7faff] rounded-full p-1 border border-[#e3e8ee]"
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
                className="px-3 py-1 mt-2 bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-semibold rounded-xl hover:from-[#FF8456] hover:to-[#FF5F51] transition shadow"
              >
                + Add Phase
              </Button>
            </div>

            {/* Tags */}
            <div className="relative">
              <FormLabel className="mb-2 block text-[#062a47] font-semibold">
                Tags
              </FormLabel>
              <div className="flex flex-wrap gap-2 mb-2">
                {tags.map((tag, idx) => (
                  <span
                    key={tag + idx}
                    className="flex items-center bg-[#eaf6fb] text-[#062a47] px-3 py-1 rounded-full text-sm border border-[#f75a2f]"
                  >
                    {tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(idx)}
                      className="ml-2 text-[#6B7A8F] hover:text-[#f75a2f]"
                      tabIndex={-1}
                    >
                      <Trash size={14} />
                    </button>
                  </span>
                ))}
              </div>
              <button
                type="button"
                className="flex items-center gap-2 bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl px-3 py-2 hover:bg-[#eaf6fb] transition"
                onClick={() => setTagDropdownOpen((v) => !v)}
              >
                <ChevronDown className="w-4 h-4" />
                {tags.length === 0 ? "Select tags" : "Add more tags"}
              </button>
              {tagDropdownOpen && (
                <div className="absolute z-20 mt-2 w-full max-h-72 overflow-y-auto bg-white border border-[#e3e8ee] rounded-xl shadow-xl p-2">
                  {tagSections.map((section, idx) => (
                    <div key={section.label}>
                      <div className="text-xs font-bold text-[#f75a2f] px-2 py-1">
                        {section.label}
                      </div>
                      <div className="flex flex-wrap gap-2 mb-2">
                        {section.tags.map((tag) => (
                          <button
                            key={tag}
                            type="button"
                            className={`px-3 py-1 rounded-full text-xs font-semibold border ${
                              tags.includes(tag)
                                ? "bg-[#f75a2f] text-white border-[#f75a2f] cursor-not-allowed"
                                : "bg-[#f7faff] text-[#062a47] border-[#e3e8ee] hover:border-[#f75a2f] hover:bg-[#eaf6fb]"
                            }`}
                            disabled={tags.includes(tag)}
                            onClick={() => handleSelectTag(tag)}
                          >
                            {tag}
                          </button>
                        ))}
                      </div>
                      {idx !== tagSections.length - 1 && (
                        <Separator className="my-2 bg-[#e3e8ee]" />
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Submit */}
            <Button
              type="submit"
              className="w-full bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-xl hover:from-[#FF8456] hover:to-[#FF5F51] transition mt-4 shadow-lg"
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
