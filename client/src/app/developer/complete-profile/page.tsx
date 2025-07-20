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
      instagram: z.string().url("Enter a valid URL").or(z.literal("")),
    })
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

function CompleteProfileForm() {
  const { user } = useAuth();
  const router = useRouter();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [step, setStep] = useState(1);
  const [countries, setCountries] = useState<
    { name: string; isoCode: string }[]
  >([]);
  const [states, setStates] = useState<{ name: string; isoCode: string }[]>([]);
  const [cities, setCities] = useState<{ name: string }[]>([]);
  const [isAutofilling, setIsAutofilling] = useState(false);

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
        instagram: "",
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

    if (user?.role === "developer" && user.isProfileComplete && user.location) {
      setIsAutofilling(true);
      const countryCode = user.location.country || "";
      const stateCode = user.location.state || "";
      const cityName = user.location.city || "";

      // 1. Reset form with all user values (sabhi fields prefill)
      reset({
        title: user.profile?.title || "",
        bio: user.profile?.bio || "",
        skills: Array.isArray(user.profile?.skills)
          ? user.profile.skills.join(", ")
          : "",
        location: {
          country: countryCode,
          state: stateCode,
          city: cityName,
          address: user.location.address || "",
        },
        socialLinks: {
          github: user.profile?.socialLinks?.github || "",
          linkedin: user.profile?.socialLinks?.linkedin || "",
          portfolio: user.profile?.socialLinks?.portfolio || "",
          twitter: user.profile?.socialLinks?.twitter || "",
          hashnode: user.profile?.socialLinks?.hashnode || "",
          devto: user.profile?.socialLinks?.devto || "",
          instagram: user.profile?.socialLinks?.instagram || "",
        },
      });

      // 2. States/cities set karo aur city ki value bhi set karo (reset ke baad)
      setTimeout(() => {
        if (countryCode) {
          const fetchedStates = State.getStatesOfCountry(countryCode);
          setStates(fetchedStates);
          if (stateCode) {
            const fetchedCities = City.getCitiesOfState(countryCode, stateCode);
            setCities(fetchedCities);
            if (cityName) form.setValue("location.city", cityName);
          } else {
            setCities([]);
          }
          form.setValue("location.country", countryCode);
          form.setValue("location.state", stateCode);
          form.setValue("location.city", cityName);
          form.setValue("location.address", user?.location?.address || "");
        }
        setIsAutofilling(false);
      }, 0);
    }
  }, [user, reset, countries.length]);

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
    if (!isAutofilling) {
      form.setValue("location.state", "");
      form.setValue("location.city", "");
      form.setValue("location.address", "");
    }
  }, [selectedCountry]);

  useEffect(() => {
    if (selectedCountry && selectedState) {
      setCities(City.getCitiesOfState(selectedCountry, selectedState));
    } else {
      setCities([]);
    }
    if (!isAutofilling) {
      form.setValue("location.city", "");
      form.setValue("location.address", "");
    }
  }, [selectedState, selectedCountry]);

  useEffect(() => {
    if (!isAutofilling) {
      form.setValue("location.address", "");
    }
  }, [selectedCity]);

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
      <div className="min-h-screen flex items-center justify-center text-xl text-white bg-[#101012]">
        This page is only for developers.
      </div>
    );
  }

  return (
    <div className="bg-[#101012] min-h-screen w-full">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-white tracking-tight">
          Complete Your Developer Profile
        </h1>
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-10 bg-[#18181e] rounded-3xl shadow-xl p-8 border border-[#23232b]"
          >
            {/* Stepper */}
            <div className="flex justify-center mb-8 gap-4">
              {/* Step 1 */}
              <button
                type="button"
                className={`px-4 py-2 rounded-xl font-semibold transition ${
                  step === 1
                    ? "bg-[#a3e635] text-black"
                    : "bg-[#23232b] text-white hover:bg-[#333]"
                }`}
                onClick={() => setStep(1)}
              >
                1. Compulsory Info
              </button>
              {/* Step 2 */}
              <button
                type="button"
                className={`px-4 py-2 rounded-xl font-semibold transition ${
                  step === 2
                    ? "bg-[#a3e635] text-black"
                    : "bg-[#23232b] text-white hover:bg-[#333]"
                }`}
                onClick={async () => {
                  // Validate step 1 fields before allowing navigation
                  const values = form.getValues();
                  if (
                    !values.title ||
                    !values.skills ||
                    !values.location?.city ||
                    !values.location?.state ||
                    !values.location?.country
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
                  <h2 className="text-xl font-bold text-white border-b border-[#23232b] pb-2">
                    Compulsory Information
                  </h2>
                  {/* Title */}
                  <FormField
                    control={control}
                    name="title"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">
                          Professional Title *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. Full Stack Developer"
                            className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Skills */}
                  <FormField
                    control={control}
                    name="skills"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">
                          Skills (comma separated) *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="React, Node.js, PostgreSQL"
                            className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Location Dropdowns */}
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {/* Country */}
                    <FormField
                      control={control}
                      name="location.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize text-white">
                            Country *
                          </FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] w-full"
                            >
                              <option value="">Select Country</option>
                              {countries.map((country) => (
                                <option
                                  key={country.isoCode}
                                  value={country.isoCode}
                                >
                                  {country.name}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* State */}
                    <FormField
                      control={control}
                      name="location.state"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize text-white">
                            State *
                          </FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] w-full"
                              disabled={!selectedCountry}
                            >
                              <option value="">Select State</option>
                              {states.map((state) => (
                                <option
                                  key={state.isoCode}
                                  value={state.isoCode}
                                >
                                  {state.name}
                                </option>
                              ))}
                            </select>
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                    {/* City */}
                    <FormField
                      control={control}
                      name="location.city"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize text-white">
                            City *
                          </FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] w-full"
                              disabled={!selectedState}
                            >
                              <option value="">Select City</option>
                              {cities.map((city) => (
                                <option key={city.name} value={city.name}>
                                  {city.name}
                                </option>
                              ))}
                            </select>
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
                        <FormLabel className="text-white">Address *</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="Enter your address"
                            className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
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
                    className="bg-[#a3e635] text-black rounded-xl font-bold"
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
                  <h2 className="text-xl font-bold text-white border-b border-[#23232b] pb-2">
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
                              <FormLabel className="capitalize text-white">
                                {key}
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder={`https://${key}.com/username`}
                                  className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
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
                    className="bg-[#23232b] text-white rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#a3e635] text-black font-bold rounded-xl"
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
