import React from "react";
import Hero from "../components/landing/Hero";
import MascotSection from "../components/landing/MascotSection";
import FeaturedJobs from "../components/landing/FeaturedJobs";
import HowItWorks from "../components/landing/HowItWorks";
import WhyChooseUs from "../components/landing/WhyChooseUs";
import Testimonials from "../components/landing/Testimonials";
import FaqPreview from "../components/landing/FaqPreview";
import CtaBanner from "../components/landing/CtaBanner";

const HomePage = () => (
  <>
    <Hero />
    <MascotSection />
    <FeaturedJobs />
    <HowItWorks />
    <WhyChooseUs />
    <Testimonials />
    <FaqPreview />
    <CtaBanner />
  </>
);

export default HomePage;
