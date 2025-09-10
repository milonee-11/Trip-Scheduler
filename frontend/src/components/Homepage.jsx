import React from "react";

import HeroSection from "./HeroSection";
import AboutSection from "./AboutSection";
import FeaturesSection from "./FeaturesSection";
import CarouselSection from "./CarouselSection";
import TestimonialsSection from "./TestimonialsSection";
import InstagramFeedSection from "./InstagramFeedSection";
import FooterSection from "./FooterSection";
import BackToTop from "./BackToTop";
import { useEffect } from "react";
const HomePage = () => {
    // Scroll to top when the component loads
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);
  return (
    <>
     
      <HeroSection />
      <AboutSection />
      <FeaturesSection />
      <CarouselSection />
      <TestimonialsSection />
      <InstagramFeedSection />
     
      <FooterSection />
      <BackToTop/>
    </>
  );
};

export default HomePage;
