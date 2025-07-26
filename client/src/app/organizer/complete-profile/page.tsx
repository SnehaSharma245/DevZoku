"use client";
import React, { Fragment, useEffect, useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Input, Textarea, Button } from "@/components/index";
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
import { useRouter } from "next/navigation";
import { Country, State, City } from "country-state-city";
import PhoneInput from "react-phone-number-input";
import "react-phone-number-input/style.css";

const formSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  bio: z.string().optional(),
  website: z.string().url("Enter a valid URL").or(z.literal("")).optional(),
  companyEmail: z.string().email("Invalid email address"),
  phoneNumber: z
    .string()
    .min(8, "Phone number is required")
    .max(16, "Phone number is too long")
    .regex(/^\+?[0-9]{8,16}$/, "Enter a valid phone number"),
  location: z.object({
    country: z.string().min(2, "Country is required"),
    state: z.string().min(2, "State is required"),
    city: z.string().min(2, "City is required"),
    address: z.string().min(2, "Address is required"),
  }),
  socialLinks: z
    .object({
      linkedin: z.string().url("Enter a valid URL").or(z.literal("")),
      twitter: z.string().url("Enter a valid URL").or(z.literal("")),
      instagram: z.string().url("Enter a valid URL").or(z.literal("")),
    })
    .optional(),
});

type FormData = z.infer<typeof formSchema>;

function OrganizerCompleteProfileForm() {
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
      organizationName: "",
      bio: "",
      website: "",
      companyEmail: "",
      phoneNumber: "",
      location: {
        country: "",
        state: "",
        city: "",
        address: "",
      },
      socialLinks: {
        linkedin: "",
        twitter: "",
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

  // Autofill logic
  useEffect(() => {
    if (countries.length === 0) {
      setCountries(Country.getAllCountries());
    }

    if (user?.profile && user.role === "organizer" && user.location) {
      setIsAutofilling(true);
      const profile = user.profile;
      const countryCode = user.location.country || "";
      const stateCode = user.location.state || "";
      const cityName = user.location.city || "";
      const address = user.location.address || "";

      // 1. Reset form with all user values
      reset({
        organizationName: profile.organizationName || "",
        bio: profile.bio || "",
        website: profile.website || "",
        companyEmail: profile.companyEmail || "",
        phoneNumber: profile.phoneNumber || "",
        location: {
          country: countryCode,
          state: stateCode,
          city: cityName,
          address: user.location.address || "",
        },
        socialLinks: {
          linkedin: profile.socialLinks?.linkedin || "",
          twitter: profile.socialLinks?.twitter || "",
          instagram: profile.socialLinks?.instagram || "",
        },
      });

      // 2. States/cities set karo aur city/address ki value bhi set karo (reset ke baad)
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
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

      // Format formData to match API expectations
      const formattedData = {
        organizationName: formData.organizationName.trim(),
        bio: formData.bio?.trim(),
        website: formData.website?.trim() || "",
        companyEmail: formData.companyEmail.trim(),
        phoneNumber: formData.phoneNumber.trim(),
        socialLinks: Object.fromEntries(
          Object.entries(formData.socialLinks || {})
            .filter(([_, value]) => value && value.trim() !== "")
            .map(([key, value]) => [key, value?.trim()])
        ),
        location: {
          country: formData.location.country.trim(),
          state: formData.location.state.trim(),
          city: formData.location.city.trim(),
          address: formData.location.address.trim(),
        },
      };

      const response = await api.post(
        `/organizer/complete-profile`,
        formattedData,
        { withCredentials: true }
      );

      const { status, message } = response.data;

      if (status === 200) {
        setUser(user ? { ...user, isProfileComplete: true } : user);

        toast.success("Organization profile updated successfully!");
        router.push(`/organizer/profile/${user?.id}`);
      }
    } catch (error: any) {
      console.error("Error updating profile:", error);
      toast.error(
        error?.response?.data?.message ||
          "Failed to update organization profile"
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 1 validation: Only required fields
  const handleNext = async () => {
    const values = form.getValues();
    if (
      !values.organizationName ||
      !values.companyEmail ||
      !values.phoneNumber ||
      !values.location?.country ||
      !values.location?.state ||
      !values.location?.city ||
      !values.location?.address
    ) {
      toast.error("Please fill all required fields");
      return;
    }
    setStep(2);
  };

  // Show grid branding only if profile is NOT complete
  if (!user?.isProfileComplete) {
    return (
      <div className="min-h-screen w-full">
        <div className="max-w-6xl mx-auto py-10 px-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-10 items-stretch">
            {/* Left Side: Branding, tagline, icons, vertical centering */}
            <div className="hidden md:flex flex-col justify-center px-10 bg-gradient-to-br from-[#EDF6FA] via-[#D9EAF2] to-[#CFE4EF] rounded-xl shadow-md h-full">
              <div className="flex flex-col justify-center items-start w-full max-w-md">
                <span
                  className="font-extrabold text-4xl tracking-tight text-[#062a47] mb-10"
                  style={{ letterSpacing: "-1px" }}
                >
                  DevZoku
                </span>
                <div className="mb-6">
                  <h2 className="text-2xl font-bold text-[#062a47] mb-3">
                    Complete Your Organization Profile
                  </h2>
                  <p className="text-base text-[#062a47] font-medium leading-relaxed">
                    <span className="font-semibold text-[#f75a2f]">
                      Stand out
                    </span>{" "}
                    in the DevZoku community and get noticed by developers and
                    organizers alike.
                  </p>
                </div>
                <ul className="text-left text-[#062a47] mb-6 space-y-3 list-disc list-inside marker:text-[#f75a2f]">
                  <li>
                    <strong>Showcase</strong> your organization and mission
                  </li>
                  <li>
                    <strong>Connect</strong> with top developers and innovators
                  </li>
                  <li>
                    <strong>Host</strong> exciting hackathons and events
                  </li>
                </ul>
                <div className="mt-2 pl-3 border-l-4 border-[#f75a2f]">
                  <span className="text-base font-semibold text-[#062a47] italic">
                    “Organizations who empower devs, build the future.”
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
                  Complete Your Organization Profile
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
                        // Validate step 1 fields before allowing navigation
                        const values = form.getValues();
                        if (
                          !values.organizationName ||
                          !values.companyEmail ||
                          !values.phoneNumber ||
                          !values.location?.country ||
                          !values.location?.state ||
                          !values.location?.city ||
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
                          Organization Information
                        </h2>
                        {/* Organization Name */}
                        <FormField
                          control={control}
                          name="organizationName"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#062a47] font-semibold">
                                Organization Name *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="e.g. DevZoku Inc."
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
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#062a47] font-semibold">
                                Organization Bio
                              </FormLabel>
                              <FormControl>
                                <Textarea
                                  {...field}
                                  placeholder="Tell us about your organization..."
                                  className="min-h-[100px] bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Website */}
                        <FormField
                          control={control}
                          name="website"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#062a47] font-semibold">
                                Website
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="https://yourcompany.com"
                                  className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Company Email */}
                        <FormField
                          control={control}
                          name="companyEmail"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#062a47] font-semibold">
                                Company Email *
                              </FormLabel>
                              <FormControl>
                                <Input
                                  {...field}
                                  placeholder="contact@yourcompany.com"
                                  className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                                />
                              </FormControl>
                              <FormMessage />
                            </FormItem>
                          )}
                        />
                        {/* Phone Number */}
                        <FormField
                          control={control}
                          name="phoneNumber"
                          render={({ field }) => (
                            <FormItem>
                              <FormLabel className="text-[#062a47] font-semibold">
                                Phone Number *
                              </FormLabel>
                              <FormControl>
                                <PhoneInput
                                  {...field}
                                  defaultCountry="IN"
                                  international
                                  countryCallingCodeEditable={true}
                                  className="bg-[#f7faff] text-black border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] w-full transition"
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
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {["linkedin", "twitter", "instagram"].map((key) => (
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
                                      placeholder={`https://${key}.com/companyname`}
                                      className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                                    />
                                  </FormControl>
                                  <FormMessage />
                                </FormItem>
                              )}
                            />
                          ))}
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
                          {isSubmitting
                            ? "Saving..."
                            : "Save Organization Profile"}
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
    <div className="min-h-screen w-full">
      <div className="max-w-2xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-[#062a47] tracking-tight">
          Edit Organization Profile
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
                  // Validate step 1 fields before allowing navigation
                  const values = form.getValues();
                  if (
                    !values.organizationName ||
                    !values.companyEmail ||
                    !values.phoneNumber ||
                    !values.location?.country ||
                    !values.location?.state ||
                    !values.location?.city ||
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
                    Organization Information
                  </h2>
                  {/* Organization Name */}
                  <FormField
                    control={control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#062a47] font-semibold">
                          Organization Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. DevZoku Inc."
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
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#062a47] font-semibold">
                          Organization Bio
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tell us about your organization..."
                            className="min-h-[100px] bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Website */}
                  <FormField
                    control={control}
                    name="website"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#062a47] font-semibold">
                          Website
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://yourcompany.com"
                            className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Company Email */}
                  <FormField
                    control={control}
                    name="companyEmail"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#062a47] font-semibold">
                          Company Email *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="contact@yourcompany.com"
                            className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Phone Number */}
                  <FormField
                    control={control}
                    name="phoneNumber"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-[#062a47] font-semibold">
                          Phone Number *
                        </FormLabel>
                        <FormControl>
                          <PhoneInput
                            {...field}
                            defaultCountry="IN"
                            international
                            countryCallingCodeEditable={true}
                            className="bg-[#f7faff] text-black border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] w-full transition"
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["linkedin", "twitter", "instagram"].map((key) => (
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
                                placeholder={`https://${key}.com/companyname`}
                                className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] transition"
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    ))}
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
                    {isSubmitting ? "Saving..." : "Save Organization Profile"}
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

// Wrap with auth HOC to ensure only authenticated organizers can access
export default withAuth(OrganizerCompleteProfileForm, "organizer");
