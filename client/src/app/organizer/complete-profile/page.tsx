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

const formSchema = z.object({
  organizationName: z.string().min(2, "Organization name is required"),
  bio: z.string().optional(),
  website: z.string().url("Enter a valid URL").or(z.literal("")).optional(), // <-- .optional() added
  companyEmail: z.string().email("Invalid email address"),
  phoneNumber: z.string().min(7, "Invalid phone number"),
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

  return (
    <div className="bg-[#101012] min-h-screen w-full">
      <div className="max-w-4xl mx-auto py-10 px-4">
        <h1 className="text-3xl font-extrabold mb-8 text-center text-white tracking-tight">
          Complete Your Organization Profile
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
                1. Basic Info
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
                  <h2 className="text-xl font-bold text-white border-b border-[#23232b] pb-2">
                    Organization Information
                  </h2>
                  {/* Organization Name */}
                  <FormField
                    control={control}
                    name="organizationName"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel className="text-white">
                          Organization Name *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="e.g. DevZoku Inc."
                            className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
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
                        <FormLabel className="text-white">
                          Organization Bio
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            {...field}
                            placeholder="Tell us about your organization..."
                            className="min-h-[100px] bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
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
                        <FormLabel className="text-white">Website</FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="https://yourcompany.com"
                            className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
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
                        <FormLabel className="text-white">
                          Company Email *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="contact@yourcompany.com"
                            className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
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
                        <FormLabel className="text-white">
                          Phone Number *
                        </FormLabel>
                        <FormControl>
                          <Input
                            {...field}
                            placeholder="+91-9876543210"
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
                              className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] p-2 w-full"
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
                              className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] p-2 w-full"
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
                              className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] p-2 w-full"
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
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {["linkedin", "twitter", "instagram"].map((key) => (
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
                                placeholder={`https://${key}.com/companyname`}
                                className="bg-[#23232b] text-white border-none rounded-xl focus:ring-2 focus:ring-[#a3e635] placeholder:text-[#888]"
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
                    className="bg-[#23232b] text-white rounded-xl"
                  >
                    Back
                  </Button>
                  <Button
                    type="submit"
                    className="bg-[#a3e635] text-black font-bold rounded-xl"
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
