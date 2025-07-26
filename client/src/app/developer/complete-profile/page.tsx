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
import PhoneInput from "react-phone-number-input";
import Link from "next/link";
import { Users, Rocket } from "lucide-react";

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

  // Show grid branding only if profile is NOT complete
  if (!user?.isProfileComplete) {
    return (
      <div className="min-h-screen w-full">
        <div className="max-w-6xl mx-auto py-10 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
            {/* Left Side: Branding, tagline, icons, vertical centering */}
            <div className="hidden md:flex flex-col justify-center px-10 bg-gradient-to-br from-[#EDF6FA] via-[#D9EAF2] to-[#CFE4EF] rounded-xl shadow-md h-full">
              <div className="flex flex-col justify-center items-start w-full max-w-md">
                <Link
                  href="/"
                  className="font-extrabold text-4xl tracking-tight text-[#062a47] mb-10 hover:text-[#f75a2f] transition-all duration-300"
                  style={{ letterSpacing: "-1px" }}
                >
                  DevZoku
                </Link>

                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#062a47] mb-3">
                    Complete Your Developer Profile
                  </h2>
                  <p className="text-base text-[#062a47] font-medium leading-relaxed">
                    <span className="font-semibold text-[#f75a2f]">
                      Stand out
                    </span>{" "}
                    in the DevZoku community and get noticed by organizers and
                    devs alike.
                  </p>
                </div>

                <ul className="text-left text-[#062a47] mb-6 space-y-3 list-disc list-inside marker:text-[#f75a2f]">
                  <li>
                    <strong>Showcase</strong> your top skills and tech stack
                  </li>
                  <li>
                    <strong>Connect</strong> with fellow innovators and mentors
                  </li>
                  <li>
                    <strong>Collaborate</strong> on exciting projects and
                    hackathons
                  </li>
                </ul>

                <div className="mt-2 pl-3 border-l-4 border-[#f75a2f]">
                  <span className="text-base font-semibold text-[#062a47] italic">
                    “Devs who squad together, win together.”
                  </span>
                </div>
              </div>
            </div>
            {/* Right Side: Form (full width on mobile) */}
            <div className="h-full w-full">
              {/* Mobile branding header */}
              <div className="md:hidden mb-8 text-center">
                <span className="text-3xl font-extrabold text-[#062a47]">
                  DevZoku
                </span>
                <h1 className="text-xl font-bold text-[#062a47] mt-2">
                  Complete Your Developer Profile
                </h1>
              </div>
              <Form {...form}>
                <form
                  onSubmit={handleSubmit(onSubmit)}
                  className="space-y-10 bg-white rounded-3xl shadow-2xl p-8 border border-[#e3e8ee]"
                >
                  {/* Stepper */}
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
                      1. Compulsory Info
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
                          {/* Country */}
                          <FormField
                            control={control}
                            name="location.country"
                            render={({ field }) => (
                              <FormItem>
                                <FormLabel className="capitalize text-[#062a47] font-semibold">
                                  Country *
                                </FormLabel>
                                <FormControl>
                                  <select
                                    {...field}
                                    className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] w-full transition"
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
                                <FormLabel className="capitalize text-[#062a47] font-semibold">
                                  State *
                                </FormLabel>
                                <FormControl>
                                  <select
                                    {...field}
                                    className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] w-full transition"
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
                                <FormLabel className="capitalize text-[#062a47] font-semibold">
                                  City *
                                </FormLabel>
                                <FormControl>
                                  <select
                                    {...field}
                                    className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] w-full transition"
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
        </div>
      </div>
    );
  }

  // If profile is complete, show edit profile heading and normal form
  return (
    <div className=" min-h-screen w-full">
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-[#062a47] tracking-tight">
          Edit Profile
        </h1>
        <Form {...form}>
          <form
            onSubmit={handleSubmit(onSubmit)}
            className="space-y-10 bg-white rounded-3xl shadow-2xl p-8 border border-[#e3e8ee]"
          >
            {/* Stepper */}
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
                1. Compulsory Info
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
                  // Validate step 1 fields before allowing navigation
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
                    {/* Country */}
                    <FormField
                      control={control}
                      name="location.country"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="capitalize text-[#062a47] font-semibold">
                            Country *
                          </FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] w-full transition"
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
                          <FormLabel className="capitalize text-[#062a47] font-semibold">
                            State *
                          </FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] w-full transition"
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
                          <FormLabel className="capitalize text-[#062a47] font-semibold">
                            City *
                          </FormLabel>
                          <FormControl>
                            <select
                              {...field}
                              className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] w-full transition"
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
