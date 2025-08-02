import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { zodResolver } from "@hookform/resolvers/zod";
import { useState } from "react";
import { PlusCircle } from "lucide-react";

const projectSchema = z.object({
  title: z.string().trim().min(1, "Project title is required"),
  description: z.string().trim().optional(),
  techStack: z.string().trim().min(1, "Tech stack is required"),
  repoUrl: z.string().trim().url("Enter a valid URL").or(z.literal("")),
  demoUrl: z.string().trim().url("Enter a valid URL").or(z.literal("")),
});

type ProjectFormData = z.infer<typeof projectSchema>;

interface AddProjectProps {
  open: boolean;
  onClose: () => void;
  onAdd: (data: ProjectFormData) => void;
}

export default function AddProjectDialog({
  open,
  onClose,
  onAdd,
}: AddProjectProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const form = useForm<ProjectFormData>({
    resolver: zodResolver(projectSchema),
    defaultValues: {
      title: "",
      description: "",
      techStack: "",
      repoUrl: "",
      demoUrl: "",
    },
  });

  const { handleSubmit, control, reset } = form;

  const handleAdd = async (data: ProjectFormData) => {
    setIsSubmitting(true);
    try {
      onAdd(data);
      reset();
      onClose();
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog
      open={open}
      onOpenChange={() => {
        reset();
        onClose();
      }}
    >
      <DialogContent
        className="max-w-lg w-full bg-gradient-to-br from-white via-white to-[#fff9f5] border border-[#e3e8ee] rounded-lg shadow-2xl p-0"
        style={{
          maxHeight: "85vh",
        }}
      >
        <div
          className="p-4 md:p-8 overflow-y-auto rounded-xl popup-scrollbar"
          style={{
            maxHeight: "85vh",
          }}
        >
          <DialogHeader className="pb-6">
            <DialogTitle className="flex items-center gap-3 text-2xl font-bold text-[#062a47]">
              <div className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#FF9466] to-[#FF6F61] flex items-center justify-center shadow-xl border-2 border-white">
                <PlusCircle className="w-6 h-6 text-white" />
              </div>
              Add New Project
            </DialogTitle>
          </DialogHeader>
          <Form {...form}>
            <form onSubmit={handleSubmit(handleAdd)} className="space-y-6 pb-4">
              <FormField
                control={control}
                name="title"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#062a47] font-semibold text-sm tracking-wide">
                      Project Title *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="Enter your project title"
                        className="bg-gradient-to-r from-[#fffdfc] to-[#fff9f5] text-[#062a47] border border-[#f4e6d9] rounded-2xl h-12 px-4  placeholder:text-[#6B7A8F] transition-all duration-200 shadow-sm"
                      />
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
                    <FormLabel className="text-[#062a47] font-semibold text-sm tracking-wide">
                      Description
                    </FormLabel>
                    <FormControl>
                      <Textarea
                        {...field}
                        placeholder="Describe your amazing project..."
                        className="bg-gradient-to-r from-[#fffdfc] to-[#fff9f5] text-[#062a47] border border-[#f4e6d9] rounded-2xl p-4 min-h-[100px] placeholder:text-[#6B7A8F] resize-none transition-all duration-200 shadow-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={control}
                name="techStack"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-[#062a47] font-semibold text-sm tracking-wide">
                      Tech Stack *
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="React, TypeScript, Node.js, MongoDB..."
                        className="bg-gradient-to-r from-[#fffdfc] to-[#fff9f5] text-[#062a47] border border-[#f4e6d9] rounded-2xl h-12 px-4 placeholder:text-[#6B7A8F] transition-all duration-200 shadow-sm"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <div className="grid grid-cols-1 gap-6">
                <FormField
                  control={control}
                  name="repoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#062a47] font-semibold text-sm tracking-wide">
                        Repository URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://github.com/..."
                          className="bg-gradient-to-r from-[#fffdfc] to-[#fff9f5] text-[#062a47] border border-[#f4e6d9] rounded-2xl h-12 px-4  placeholder:text-[#6B7A8F] transition-all duration-200 shadow-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="demoUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel className="text-[#062a47] font-semibold text-sm tracking-wide">
                        Live Demo URL
                      </FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          placeholder="https://your-demo.com"
                          className="bg-gradient-to-r from-[#fffdfc] to-[#fff9f5] text-[#062a47] border border-[#f4e6d9] rounded-2xl h-12 px-4 placeholder:text-[#6B7A8F] transition-all duration-200 shadow-sm"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
              <DialogFooter className="gap-3 pt-6 pb-2">
                <Button
                  type="button"
                  variant="ghost"
                  className="rounded-2xl px-6 py-3 text-[#6B7A8F] hover:text-[#062a47] hover:bg-[#fbf3ea] transition-all duration-200 border border-[#e3e8ee] cursor-pointer"
                  onClick={() => {
                    reset();
                    onClose();
                  }}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="bg-gradient-to-r from-[#FF9466] to-[#FF6F61] text-white font-bold rounded-2xl px-8 py-3 hover:from-[#FF8456] hover:to-[#FF5F51] transition-all duration-200 shadow-lg hover:shadow-[#FF6F61]/25 disabled:opacity-50 disabled:cursor-not-allowed border-2 border-white cursor-pointer"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Adding Project..." : "Add Project"}
                </Button>
              </DialogFooter>
            </form>
          </Form>
        </div>
      </DialogContent>
    </Dialog>
  );
}
