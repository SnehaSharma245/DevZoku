import React, { useState } from "react";

interface FAQItem {
  question: string;
  answer: string;
}

const FAQ: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(null);

  const faqData: FAQItem[] = [
    {
      question: "How do I join a hackathon on DevZoku?",
      answer:
        "Simply browse our available hackathons, click on the one that interests you, and hit 'Join'. You can participate as an individual or form teams with other developers.",
    },
    {
      question: "Can I organize my own hackathon?",
      answer:
        "Yes! DevZoku makes it easy for organizers to create and manage hackathons. Sign up as an organizer, set up your event details, and start attracting talented developers to participate.",
    },
    {
      question: "What types of hackathons are available?",
      answer:
        "We host various types of hackathons including web development, mobile apps, AI/ML, blockchain, game development, and more. There's something for every developer skill level.",
    },
    {
      question: "Is DevZoku free to use?",
      answer:
        "DevZoku is free for developers to join hackathons. Organizers have access to both free and premium features to enhance their event management experience.",
    },
    {
      question: "How are teams formed?",
      answer:
        "You can either join with an existing team or use our team matching feature to connect with other developers based on skills, interests, and project ideas.",
    },
    {
      question: "What support do participants get?",
      answer:
        "We provide mentorship opportunities, technical resources, documentation, and community support throughout the hackathon to help you succeed.",
    },
  ];

  const toggleFAQ = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4 sm:px-6 lg:px-8 relative overflow-hidden bg-gradient-to-br from-[#F8FBFD] via-[#FAFCFD] to-[#FFFFFF]">
      {/* Decorative background shapes for FAQ */}
      <div
        className="pointer-events-none select-none absolute inset-0 z-0"
        aria-hidden="true"
      >
        <div className="absolute top-[5%] left-[5%] w-16 h-16 bg-[#FF9466]/10 rotate-45 rounded-lg"></div>
        <div className="absolute top-[20%] right-[8%] w-20 h-20 bg-[#FF6F61]/10 rounded-full"></div>
        <div className="absolute top-[70%] left-[15%] w-12 h-12 bg-[#2563eb]/15 rotate-12 rounded-lg"></div>
        <div className="absolute bottom-[10%] right-[10%] w-18 h-18 bg-[#FF9466]/20 rounded-full"></div>
        <div className="absolute top-[40%] left-[3%] w-8 h-8 bg-[#FF6F61]/20 rounded-full"></div>
        <div className="absolute top-[85%] right-[25%] w-14 h-14 bg-[#2563eb]/20 rotate-45 rounded-lg"></div>
        <div className="absolute top-[15%] left-[40%] w-10 h-10 bg-[#FF9466]/15 rounded-full"></div>
      </div>

      <div className="max-w-4xl mx-auto w-full relative z-10">
        <div className="text-center space-y-12">
          {/* FAQ Header */}
          <div className="space-y-6">
            <h2 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-[#062a47] leading-tight">
              Frequently Asked{" "}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#FF9466] to-[#FF6F61]">
                Questions
              </span>
            </h2>
            <p className="text-base sm:text-lg text-gray-600 max-w-2xl mx-auto leading-relaxed">
              Everything you need to know about DevZoku and how to make the most
              of your hackathon experience.
            </p>
          </div>

          {/* FAQ Accordion */}
          <div className="space-y-4">
            {faqData.map((faq, index) => (
              <div
                key={index}
                className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <button
                  className="w-full px-6 py-6 text-left focus:outline-none focus:ring-2 focus:ring-[#FF8A65] focus:ring-opacity-50 rounded-2xl"
                  onClick={() => toggleFAQ(index)}
                >
                  <div className="flex justify-between items-center">
                    <h3 className="text-lg font-semibold text-[#062a47] pr-4">
                      {faq.question}
                    </h3>
                    <div
                      className={`flex-shrink-0 w-6 h-6 rounded-full bg-gradient-to-r from-[#FF9466] to-[#FF6F61] flex items-center justify-center transition-transform duration-300 ${
                        openIndex === index ? "rotate-180" : ""
                      }`}
                    >
                      <svg
                        className="w-4 h-4 text-white"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M19 9l-7 7-7-7"
                        />
                      </svg>
                    </div>
                  </div>
                </button>

                {openIndex === index && (
                  <div className="px-6 pb-6">
                    <div className="border-t border-gray-100 pt-4">
                      <p className="text-gray-600 leading-relaxed">
                        {faq.answer}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Contact CTA */}
          <div className="bg-white rounded-2xl shadow-sm p-8 border border-gray-100 mb-2">
            <h3 className="text-xl font-bold text-[#062a47] mb-4">
              Still have questions?
            </h3>
            <p className="text-gray-600 mb-6">
              Can't find the answer you're looking for? Our support team is here
              to help.
            </p>
            <button
              className="px-8 py-3 bg-[#FF8A65] text-white font-bold rounded-2xl hover:bg-[#062a47] transition-all duration-300 shadow-lg hover:shadow-xl"
              onClick={() => {
                window.location.href = "mailto:appsbysneha@gmail.com";
              }}
            >
              Contact Support
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FAQ;
