"use client";
import React, { Fragment, useEffect, useRef, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { useRouter } from "next/navigation";
import { Input, Button } from "@/components/index";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { useAuth } from "@/hooks/useAuth";
import { withAuth } from "@/utils/withAuth";
import { toast } from "sonner";
import api from "@/utils/api";
import { Country, State, City } from "country-state-city";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formSchema = z.object({
  title: z.string().trim().min(2, "Title is required"),
  bio: z.string().optional(),
  skills: z.string().min(2, "Skills are required"),
  location: z.object({
    city: z.string().min(2, "City is required"),
    state: z.string().min(2, "State is required"),
    country: z.string().min(2, "Country is required"),
    address: z.string().min(2, "Address is required"),
  }),

  socialLinks: z
    .object({
      github: z.string().url("Enter a valid URL").or(z.literal("")),
      linkedin: z.string().url("Enter a valid URL").or(z.literal("")),
      portfolio: z.string().url("Enter a valid URL").or(z.literal("")),
      twitter: z.string().url("Enter a valid URL").or(z.literal("")),
      hashnode: z.string().url("Enter a valid URL").or(z.literal("")),
      devto: z.string().url("Enter a valid URL").or(z.literal("")),
    })
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

function CompleteProfileForm() {
  const { user, setUser } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [countries, setCountries] = useState<
    { name: string; isoCode: string }[]
  >([]);
  const [states, setStates] = useState<{ name: string; isoCode: string }[]>([]);
  const [cities, setCities] = useState<{ name: string }[]>([]);

  const form = useForm<FormData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      title: "",
      bio: "",
      skills: "",
      location: {
        city: "",
        state: "",
        country: "",
        address: "",
      },
      socialLinks: {
        github: "",
        linkedin: "",
        portfolio: "",
        twitter: "",
        hashnode: "",
        devto: "",
      },
    },
  });

  const {
    control,
    handleSubmit,
    formState: { errors },
    reset,
    watch,
  } = form;

  // Fetch all countries on mount
  useEffect(() => {
    if (countries.length === 0) {
      setCountries(Country.getAllCountries());
    }

    // Autofill logic for edit mode (like UpdateProfilePage)
    if (user?.role === "developer" && user.isProfileComplete && user.location) {
      const fetchData = async () => {
        try {
          // Fetch countries
          const fetchedCountries = Country.getAllCountries();
          setCountries(fetchedCountries);

          // Find country object by name or ISO code
          const countryObj = fetchedCountries.find(
            (c) =>
              c.name === user?.location?.country ||
              c.isoCode === user?.location?.country
          );
          const countryCode = countryObj?.isoCode || "";

          // Find state object and code
          let stateCode = "";
          if (countryCode) {
            const fetchedStates = State.getStatesOfCountry(countryCode);
            setStates(fetchedStates);

            const stateObj = fetchedStates.find(
              (s) =>
                s.name === user?.location?.state ||
                s.isoCode === user?.location?.state
            );
            stateCode = stateObj?.isoCode || "";

            // Find cities if state exists
            if (stateCode) {
              const fetchedCities = City.getCitiesOfState(
                countryCode,
                stateCode
              );
              setCities(fetchedCities);
            } else {
              setCities([]);
            }
          }

          // Reset form with proper ISO codes for country/state and name for city
          const formData = {
            title: user.profile?.title || "",
            bio: user.profile?.bio || "",
            skills: Array.isArray(user.profile?.skills)
              ? user.profile.skills.join(", ")
              : "",
            location: {
              country: countryCode,
              state: stateCode,
              city: user?.location?.city || "",
              address: user?.location?.address || "",
            },
            socialLinks: {
              github: user?.profile?.socialLinks?.github || "",
              linkedin: user?.profile?.socialLinks?.linkedin || "",
              portfolio: user?.profile?.socialLinks?.portfolio || "",
              twitter: user?.profile?.socialLinks?.twitter || "",
              hashnode: user?.profile?.socialLinks?.hashnode || "",
              devto: user?.profile?.socialLinks?.devto || "",
            },
          };

          reset(formData);
        } catch (error) {
          console.error("Error in autofill:", error);
        }
      };

      fetchData();
    }
  }, [user, reset, countries.length, form]);

  // Watch for country/state/city changes
  const selectedCountry = watch("location.country");
  const selectedState = watch("location.state");
  const selectedCity = watch("location.city");

  useEffect(() => {
    if (selectedCountry) {
      setStates(State.getStatesOfCountry(selectedCountry));
    } else {
      setStates([]);
    }
    setCities([]);
  }, [selectedCountry, form]);

  useEffect(() => {
    if (selectedCountry && selectedState) {
      setCities(City.getCitiesOfState(selectedCountry, selectedState));
    } else {
      setCities([]);
    }
  }, [selectedState, selectedCountry, form]);

  const onSubmit = async (formData: FormData) => {
    try {
      setIsSubmitting(true);

      const formattedData = {
        title: formData.title?.trim(),
        bio: formData.bio?.trim(),
        skills: formData.skills
          ? formData.skills
              .split(",")
              .map((s) => s.trim())
              .filter(Boolean)
          : [],
        location: formData.location && {
          city: formData.location.city?.trim() || "",
          state: formData.location.state?.trim(),
          country: formData.location.country?.trim() || "",
          address: formData.location.address?.trim() || "",
        },
        socialLinks:
          formData.socialLinks &&
          Object.fromEntries(
            Object.entries(formData.socialLinks)
              .filter(([_, value]) => value && value.trim() !== "")
              .map(([key, value]) => [key, value?.trim()])
          ),
      };

      const res = await api.post(`/developer/complete-profile`, formattedData, {
        withCredentials: true,
      });

      const { status, data, message } = res.data;

      if (status === 200) {
        setUser(user ? { ...user, isProfileComplete: true } : user);
        toast.success(message || "Profile updated successfully!");
        router.push(`/developer/profile/${user?.id}`);
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(error?.response?.data?.message || "Failed to update profile");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1 validation: Only required fields
  const handleNext = async () => {
    const values = form.getValues();
    if (
      !values.title ||
      !values.skills ||
      !values.location?.city ||
      !values.location?.state ||
      !values.location?.country
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    setStep(2);
  };

  if (user?.role !== "developer") {
    return (
      <div className="min-h-screen flex items-center justify-center text-xl text-[#062a47] bg-[#cddefa]">
        This page is only for developers.
      </div>
    );
  }

  // Show form UI similar to HeroSection (centered, clean, no left branding)
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 ">
      <div className="max-w-xl w-full mx-auto">
        <div className="text-center space-y-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#062a47] leading-tight mt-3">
            {user?.isProfileComplete
              ? "Edit Your Developer Profile"
              : "Complete Your Developer Profile"}
          </h1>
        </div>
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-10 bg-white rounded-3xl shadow-2xl p-8 border border-[#e3e8ee]"
          >
            <div className="flex justify-center mb-8 gap-4">
              {/* Step 1 */}
              <button
                type="button"
                className={`px-4 py-2 rounded-xl font-semibold transition shadow ${
                  step === 1
                    ? "bg-[#f75a2f] text-white"
                    : "bg-[#062a47] text-white hover:bg-[#f75a2f] hover:text-white"
                }`}
                onClick={() => setStep(1)}
              >
                1. Basic Info
              </button>
              {/* Step 2 */}
              <button
                type="button"
                className={`px-4 py-2 rounded-xl font-semibold transition shadow ${
                  step === 2
                    ? "bg-[#f75a2f] text-white"
                    : "bg-[#062a47] text-white hover:bg-[#f75a2f] hover:text-white"
                }`}
                onClick={async () => {
                  const values = form.getValues();
                  if (
                    !values.title ||
                    !values.skills ||
                    !values.location?.city ||
                    !values.location?.state ||
                    !values.location?.country ||
                    !values.location?.address
                  ) {
                    toast.error("Please complete Compulsory Info first");
                    return;
                  }
                  setStep(2);
                }}
              >
                2. Social Links
              </button>
            </div>
            {/* Step 1: Compulsory Info */}
            {step === 1 && (
              <Fragment>
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-[#062a47] border-b border-[#e3e8ee] pb-2">
                    Basic Information
                  </h2>
                  {/* Title */}
                  <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#062a47] font-semibold">
                          Professional Title *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. Full Stack Developer"
                            className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Bio */}
                  <FormField
                    control={control}
                    name="bio"
                    render={({ field }) => {
                      const bioValue = field.value || "";
                      return (
                        <FormItem>
                          <div className="flex justify-between items-center mb-1 w-full">
                            <FormLabel className="text-[#062a47] font-semibold m-0">
                              Bio{" "}
                              <span className="text-gray-400 font-normal">
                                (optional)
                              </span>
                            </FormLabel>
                            <span className="text-xs text-gray-500">
                              {bioValue.length}/250
                            </span>
                          </div>
                          <FormControl>
                            <textarea
                              {...field}
                              maxLength={250}
                              rows={4}
                              placeholder="Tell us about yourself (max 250 characters)"
                              className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition w-full resize-none p-3"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      );
                    }}
                  />
                  {/* Skills */}
                  <FormField
                    control={control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#062a47] font-semibold">
                          Skills (comma separated) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="React, Node.js, PostgreSQL"
                            className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Location Dropdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Country DropdownMenu */}
                    <FormField
                      control={control}
                      name="location.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize text-[#062a47] font-semibold">
                            Country *
                          </FormLabel>
                          <FormControl>
                            <DropdownMenu>
                              <DropdownMenuTrigger className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl px-4 py-1 w-full text-left">
                                {field.value
                                  ? countries.find(
                                      (c) => c.isoCode === field.value
                                    )?.name
                                  : "Select Country"}
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
                                {countries.map((country) => (
                                  <DropdownMenuItem
                                    key={country.isoCode}
                                    onClick={() =>
                                      field.onChange(country.isoCode)
                                    }
                                  >
                                    {country.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* State DropdownMenu */}
                    <FormField
                      control={control}
                      name="location.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize text-[#062a47] font-semibold">
                            State *
                          </FormLabel>
                          <FormControl>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className={`bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl px-4 py-1 w-full text-left ${
                                  !selectedCountry
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                disabled={!selectedCountry}
                              >
                                {field.value
                                  ? states.find(
                                      (s) => s.isoCode === field.value
                                    )?.name
                                  : "Select State"}
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
                                {states.map((state) => (
                                  <DropdownMenuItem
                                    key={state.isoCode}
                                    onClick={() =>
                                      field.onChange(state.isoCode)
                                    }
                                  >
                                    {state.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* City DropdownMenu */}
                    <FormField
                      control={control}
                      name="location.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize text-[#062a47] font-semibold">
                            City *
                          </FormLabel>
                          <FormControl>
                            <DropdownMenu>
                              <DropdownMenuTrigger
                                className={`bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl px-4 py-1 w-full text-left ${
                                  !selectedState
                                    ? "opacity-50 cursor-not-allowed"
                                    : ""
                                }`}
                                disabled={!selectedState}
                              >
                                {field.value
                                  ? cities.find((c) => c.name === field.value)
                                      ?.name
                                  : "Select City"}
                              </DropdownMenuTrigger>
                              <DropdownMenuContent className="w-full max-h-60 overflow-y-auto">
                                {cities.map((city) => (
                                  <DropdownMenuItem
                                    key={city.name}
                                    onClick={() => field.onChange(city.name)}
                                  >
                                    {city.name}
                                  </DropdownMenuItem>
                                ))}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>
                  {/* Address Field */}
                  <FormField
                    control={control}
                    name="location.address"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#062a47] font-semibold">
                          Address *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your address"
                            className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>
                <div className="flex justify-end mt-8">
                  <Button
                    type="button"
                    onClick={handleNext}
                    className="bg-[#f75a2f] text-white rounded-xl font-bold shadow hover:bg-[#062a47] transition"
                  >
                    Next
                  </Button>
                </div>
              </Fragment>
            )}
            {/* Step 2: Social Links */}
            {step === 2 && (
              <Fragment>
                <div className="space-y-6">
                  <h2 className="text-xl font-bold text-[#062a47] border-b border-[#e3e8ee] pb-2">
                    Social Links (Optional)
                  </h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {Object.keys(form.getValues().socialLinks || {}).map(
                      (key) => (
                        <FormField
                          key={key}
                          control={control}
                          name={`socialLinks.${key}` as any}
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="capitalize text-[#062a47] font-semibold">
                                {key}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={`https://${key}.com/username`}
                                  className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                      )
                    )}
                  </div>
                </div>
                <div className="flex justify-between mt-8">
                  <Button
                    type="button"
                    onClick={() => setStep(1)}
                    className="bg-[#062a47] text-white rounded-xl shadow hover:bg-[#f75a2f] transition"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#f75a2f] text-white font-bold rounded-xl shadow hover:bg-[#062a47] transition"
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? "Saving..." : "Save Profile"}
                  </Button>
                </div>
              </Fragment>
            )}
          </form>
        </Form>
      </div>
    </div>
  );
}

// Wrap with auth HOC to ensure only authenticated developers can access
export default withAuth(CompleteProfileForm, "developer");
