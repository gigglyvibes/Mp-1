import React from "react";
import HowItWorks from "../components/landing/HowItWorks";
import WhyChooseUs from "../components/landing/WhyChooseUs";
import CtaBanner from "../components/landing/CtaBanner";

const HowItWorksPage = () => (
  <>
    <div className="container-app pt-16">
      <p className="eyebrow">The full picture</p>
      <h1 className="mt-2 max-w-xl text-3xl font-bold sm:text-4xl">How Nearpin works, end to end.</h1>
    </div>
    <HowItWorks />
    <WhyChooseUs />
    <CtaBanner />
  </>
);

export default HowItWorksPage;
