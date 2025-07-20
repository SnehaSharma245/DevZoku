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
        reset(); // Reset fields on dialog close
        onClose();
      }}
    >
      <DialogContent className="max-w-lg bg-[#23232b] border border-[#23232b] rounded-2xl shadow-2xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-white">
            <PlusCircle className="w-6 h-6 text-[#a3e635]" />
            Add Project
          </DialogTitle>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={handleSubmit(handleAdd)} className="space-y-4">
            <FormField
              control={control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="text-white font-semibold">
                    Project Title *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="Project Title"
                      className="bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
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
                  <FormLabel className="text-white font-semibold">
                    Description
                  </FormLabel>
                  <FormControl>
                    <Textarea
                      {...field}
                      placeholder="Describe your project"
                      className="bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888] resize-none"
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
                  <FormLabel className="text-white font-semibold">
                    Tech Stack (comma separated) *
                  </FormLabel>
                  <FormControl>
                    <Input
                      {...field}
                      placeholder="React, Node.js, MongoDB"
                      className="bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={control}
                name="repoUrl"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-white font-semibold">
                      Repo URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://github.com/..."
                        className="bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
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
                    <FormLabel className="text-white font-semibold">
                      Demo URL
                    </FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        placeholder="https://your-demo.com"
                        className="bg-[#18181e] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                className="rounded-xl"
                onClick={() => {
                  reset(); // Reset fields on cancel
                  onClose();
                }}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                className="bg-[#a3e635] text-black font-bold rounded-xl hover:bg-lime-400 transition"
                disabled={isSubmitting}
              >
                {isSubmitting ? "Adding..." : "Add Project"}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
