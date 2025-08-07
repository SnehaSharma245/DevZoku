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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
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

  const bioValue = watch("bio") || "";

  // Autofill logic
  useEffect(() => {
    if (countries.length === 0) {
      setCountries(Country.getAllCountries());
    }

    if (user?.profile && user.role === "organizer" && user.location) {
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
            organizationName: user.profile?.organizationName || "",
            bio: user.profile?.bio || "",
            website: user.profile?.website || "",
            companyEmail: user.profile?.companyEmail || "",
            phoneNumber: user.profile?.phoneNumber || "",
            location: {
              country: countryCode,
              state: stateCode,
              city: user?.location?.city || "",
              address: user?.location?.address || "",
            },
            socialLinks: {
              linkedin: user?.profile?.socialLinks?.linkedin || "",
              twitter: user?.profile?.socialLinks?.twitter || "",
              instagram: user?.profile?.socialLinks?.instagram || "",
            },
          };

          reset(formData);
        } catch (error) {
          console.error("Error in autofill:", error);
        }
      };

      fetchData();
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

      // Find full names for country, state, city
      const countryObj = countries.find(
        (c) => c.isoCode === formData.location.country
      );
      const stateObj = states.find(
        (s) => s.isoCode === formData.location.state
      );
      const cityObj = cities.find((c) => c.name === formData.location.city);

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
          country: countryObj?.name || formData.location.country.trim(),
          state: stateObj?.name || formData.location.state.trim(),
          city: cityObj?.name || formData.location.city.trim(),
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

  // Show centered form UI like developer complete-profile page
  if (!user?.isProfileComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
        <div className="max-w-xl w-full mx-auto">
          <div className="text-center space-y-6 mb-8">
            <h1 className="text-3xl sm:text-4xl font-bold text-[#062a47] leading-tight mt-3">
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
                    <div className="flex items-center justify-between">
                      <FormLabel className="text-xl font-bold text-[#062a47] pb-2">
                        Organization Bio
                      </FormLabel>
                      <span className="text-sm text-[#8ca2c3]">
                        {bioValue.length}/250
                      </span>
                    </div>
                    <FormField
                      control={control}
                      name="bio"
                      render={({ field }) => (
                        <FormItem>
                          <FormControl>
                            <Textarea
                              {...field}
                              maxLength={250}
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
                            <div className="relative">
                              <PhoneInput
                                {...field}
                                defaultCountry="IN"
                                international
                                countryCallingCodeEditable={true}
                                className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl focus:ring-2 focus:ring-[#f75a2f] placeholder:text-[#8ca2c3] w-full transition [&>input]:bg-[#f7faff] [&>input]:text-[#062a47] [&>input]:border-none [&>input]:rounded-xl [&>input]:focus:ring-2 [&>input]:focus:ring-[#f75a2f] [&>input]:placeholder:text-[#8ca2c3] [&>.PhoneInputCountry]:bg-[#f7faff] [&>.PhoneInputCountrySelect]:bg-[#f7faff] [&>.PhoneInputCountrySelect]:border-none [&>.PhoneInputCountrySelect]:rounded-xl"
                              />
                            </div>
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
                                <DropdownMenuTrigger className="bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl px-4 w-full text-left focus:ring-2 focus:ring-[#f75a2f] transition">
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
                                  className={`bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl px-4  w-full text-left focus:ring-2 focus:ring-[#f75a2f] transition ${
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
                                  className={`bg-[#f7faff] text-[#062a47] border border-[#e3e8ee] rounded-xl px-4  w-full text-left focus:ring-2 focus:ring-[#f75a2f] transition ${
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

  // If profile is complete, show edit profile heading and normal form
  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8">
      <div className="max-w-xl w-full mx-auto">
        <div className="text-center space-y-6 mb-8">
          <h1 className="text-3xl sm:text-4xl font-bold text-[#062a47] leading-tight mt-3">
            Edit Organization Profile
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
                            className="bg-[#f7faff] text-[#062a47] rounded-xl placeholder:text-[#8ca2c3] transition"
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Bio */}
                  <div className="flex items-center justify-between">
                    <FormLabel className=" font-semibold text-[#062a47] ">
                      Organization Bio
                    </FormLabel>
                    <span className="text-sm text-[#8ca2c3]">
                      {bioValue.length}/250
                    </span>
                  </div>
                  <FormField
                    control={control}
                    name="bio"
                    render={({ field }) => (
                      <FormItem>
                        <FormControl>
                          <Textarea
                            {...field}
                            maxLength={250}
                            placeholder="Tell us about your organization..."
                            className="min-h-[100px] bg-[#f7faff] text-[#062a47] \ rounded-xl\ placeholder:text-[#8ca2c3] transition"
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
                            className="bg-[#f7faff] text-[#062a47]  rounded-xl placeholder:text-[#8ca2c3] transition"
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
                            className="bg-[#f7faff] text-[#062a47]  rounded-xl placeholder:text-[#8ca2c3] transition"
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
                          <div className="relative">
                            <PhoneInput
                              {...field}
                              defaultCountry="IN"
                              international
                              countryCallingCodeEditable={true}
                              className="bg-[#f7faff] text-[#062a47]  rounded-xl placeholder:text-[#8ca2c3] w-full  transition [&>input]:bg-[#f7faff] [&>input]:text-[#062a47] [&>input]:border-none [&>input]:rounded-xl [&>input]:focus:ring-2 [&>input]:focus:ring-[#f75a2f] [&>input]:placeholder:text-[#8ca2c3] [&>.PhoneInputCountry]:bg-[#f7faff] [&>.PhoneInputCountrySelect]:bg-[#f7faff] [&>.PhoneInputCountrySelect]:border-none [&>.PhoneInputCountrySelect]:rounded-xl"
                            />
                          </div>
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
                              <DropdownMenuTrigger className="bg-[#f7faff] text-[#062a47] focus:ring-[2px] focus:ring-[#f75a2f]  rounded-xl px-4 py-1  w-full text-left  transition">
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
                                className={`bg-[#f7faff] text-[#062a47] rounded-xl px-4 py-1 w-full text-left focus:ring-2  transition ${
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
                                className={`bg-[#f7faff] text-[#062a47] rounded-xl px-4 py-1 w-full text-left focus:ring-2  transition ${
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
                            className="bg-[#f7faff] text-[#062a47] rounded-xl placeholder:text-[#8ca2c3] transition"
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
                                className="bg-[#f7faff] text-[#062a47] rounded-xl placeholder:text-[#8ca2c3] transition"
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
