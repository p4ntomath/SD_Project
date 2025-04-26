import React from "react";
import NavBar from "../components/navigationBar.jsx";
import welcomeDisplay from "../assets/welcomeDisplayImage.jpg";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function WelcomePage() {
  const navigate = useNavigate();

  const fadeInUp = {
    hidden: { opacity: 0, y: 20 },
    visible: { 
      opacity: 1, 
      y: 0,
      transition: {
        duration: 0.6
      }
    }
  };

  const fadeInLeft = {
    hidden: { opacity: 0, x: -50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.8
      }
    }
  };

  const fadeInRight = {
    hidden: { opacity: 0, x: 50 },
    visible: { 
      opacity: 1, 
      x: 0,
      transition: {
        duration: 0.8
      }
    }
  };

  const staggerContainer = {
    hidden: {},
    visible: {
      transition: {
        staggerChildren: 0.2
      }
    }
  };

  return (
    <section className="min-h-screen flex flex-col bg-gradient-to-b from-white to-blue-50">
      <NavBar />
      
      {/* Hero Section */}
      <main className="flex-grow flex flex-col pt-4">
        <section className="py-6 md:py-2">
          <article className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-x-12">
            {/* Text Content */}
            <motion.section 
              className="md:w-1/2 w-full flex flex-col items-center md:items-start text-center md:text-start"
              initial="hidden"
              animate="visible"
              variants={fadeInLeft}
            >
              <motion.h1 
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 bg-gradient-to-r from-blue-600 to-pink-500 bg-clip-text text-transparent"
                variants={fadeInUp}
              >
                One platform.
                <br />
                Endless Academic Possibilities
              </motion.h1>
              <motion.p 
                className="text-lg mb-8 text-gray-600 max-w-xl leading-relaxed"
                variants={fadeInUp}
              >
                All your research tools, in one brilliant place.
                Whether you're a student, researcher, or academic collaborator,
                our platform simplifies the entire research journey.
              </motion.p>
              <motion.button
                className="bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-8 rounded-lg text-lg shadow-lg"
                onClick={() => navigate("/signup")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variants={fadeInUp}
              >
                Get Started Now
              </motion.button>
            </motion.section>
  
            {/* Image */}
            <motion.figure 
              className="md:w-1/2 mt-8 md:mt-0 p-4"
              initial="hidden"
              animate="visible"
              variants={fadeInRight}
            >
              <img
                src={welcomeDisplay}
                alt="Research collaboration illustration"
                className="max-w-full h-auto rounded-lg shadow-2xl"
              />
            </motion.figure>
          </article>
        </section>

        {/* Features Section */}
        <section className="py-16 bg-white">
          <motion.div 
            className="container mx-auto px-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-center mb-12"
              variants={fadeInUp}
            >
              Why Choose Re:Search?
            </motion.h2>
            <motion.div 
              className="grid md:grid-cols-3 gap-8"
              variants={staggerContainer}
            >
              {/* Feature 1 */}
              <motion.div 
                className="bg-blue-50 p-6 rounded-xl"
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Project Management</h3>
                <p className="text-gray-600">Create, track, and manage research projects with ease. Set milestones and monitor progress in real-time.</p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                className="bg-pink-50 p-6 rounded-xl"
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-pink-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Collaboration Tools</h3>
                <p className="text-gray-600">Connect with researchers, share resources, and work together seamlessly on projects.</p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                className="bg-purple-50 p-6 rounded-xl"
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2">Fund Management</h3>
                <p className="text-gray-600">Track research funding, manage expenses, and generate comprehensive financial reports.</p>
              </motion.div>
            </motion.div>
          </motion.div>
        </section>

        {/* CTA Section */}
        <motion.section 
          className="py-16 bg-gradient-to-r from-blue-600 to-pink-500"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <div className="container mx-auto px-4 text-center">
            <motion.h2 
              className="text-3xl md:text-4xl font-bold text-white mb-6"
              variants={fadeInUp}
            >
              Ready to Transform Your Research Journey?
            </motion.h2>
            <motion.p 
              className="text-xl text-white/90 mb-8 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Join thousands of researchers who are already using Re:Search to streamline their academic work.
            </motion.p>
            <motion.button
              onClick={() => navigate("/signup")}
              className="bg-white text-blue-600 font-bold py-3 px-8 rounded-lg text-lg shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Up Now
            </motion.button>
          </div>
        </motion.section>
      </main>
    </section>
  );
}
