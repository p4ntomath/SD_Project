import React, { useEffect, useRef, useState } from "react";
import NavBar from "../components/navigationBar.jsx";
import welcomeDisplay from "../assets/welcomeDisplayImage.jpg";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";

export default function WelcomePage() {
  const navigate = useNavigate();
  const [vantaEffect, setVantaEffect] = useState(null);
  const vantaRef = useRef(null);

  useEffect(() => {
    if (!vantaEffect && vantaRef.current && window.VANTA) {
      setVantaEffect(
        window.VANTA.WAVES({
          el: vantaRef.current,
          mouseControls: true,
          touchControls: true,
          gyroControls: false,
          minHeight: 200.00,
          minWidth: 200.00,
          scale: 1.00,
          scaleMobile: 1.00,
          color: 0x002E61,
          shininess: 30.00,
          waveHeight: 15.00,
          waveSpeed: 1.00,
          zoom: 1.00
        })
      );
    }
    return () => {
      if (vantaEffect) vantaEffect.destroy();
    };
  }, [vantaEffect]);

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
    <section ref={vantaRef} className="min-h-screen">
      <section className="min-h-screen flex flex-col relative">
        <NavBar />
        
        {/* Hero Section */}
        <section id="home" className="pt-24 pb-6 md:py-24 flex-grow">
          <article className="container mx-auto px-4 flex flex-col md:flex-row items-center justify-between gap-x-12">
            <motion.section
              className="md:w-1/2 w-full flex flex-col items-center md:items-start text-center md:text-start"
              initial="hidden"
              animate="visible"
              variants={fadeInLeft}
            >
              <motion.h1
                className="text-4xl md:text-5xl lg:text-6xl font-bold mb-6 text-white"
                variants={fadeInUp}
              >
                Research Management
                <br />
                & Collaboration Hub
              </motion.h1>
              <motion.p
                className="text-lg mb-8 text-gray-200 max-w-xl leading-relaxed"
                variants={fadeInUp}
              >
                A comprehensive platform for researchers, reviewers, and administrators. Manage research projects, collaborate with peers, track funding, and streamline the entire academic research lifecycle in one secure environment.
              </motion.p>
              <motion.button
                className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-8 rounded-lg text-lg shadow-lg"
                onClick={() => navigate("/signup")}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                variants={fadeInUp}
              >
                Get Started Now
              </motion.button>
            </motion.section>

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

        <section id="features" className="py-16">
          <motion.div
            className="container mx-auto px-4"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true, margin: "-100px" }}
            variants={staggerContainer}
          >
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-center mb-12 text-white"
              variants={fadeInUp}
            >
              Complete Research Management Solution
            </motion.h2>
            <motion.section
              className="grid md:grid-cols-3 gap-8"
              variants={staggerContainer}
            >
              {/* Feature 1 */}
              <motion.section
                className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20"
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <section className="w-12 h-12 bg-blue-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-blue-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>

                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Expert Review System</h3>
                <p className="text-gray-300">Get valuable feedback from expert reviewers. Track review requests and manage project evaluations efficiently.</p>
              </motion.div>


              {/* Feature 2 */}
              <motion.section
                className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20"
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <section className="w-12 h-12 bg-pink-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-pink-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>

                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Document Sharing</h3>
                <p className="text-gray-300">Share research materials, collaborate on documents, and manage versions with team members and reviewers.</p>
              </motion.div>

              {/* Feature 3 */}
              <motion.section
                className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20"
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <section className="w-12 h-12 bg-purple-500/20 rounded-lg flex items-center justify-center mb-4">
                  <svg className="w-6 h-6 text-purple-300" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-xl font-semibold mb-2 text-white">Funding Tracker</h3>
                <p className="text-gray-300">Monitor project funding, track expenses, discover funding opportunities, and generate comprehensive financial reports.</p>
              </motion.div>
            </motion.div>
          </motion.div>

          {/* Role-specific Features */}
          <section>
            <motion.div className="container mx-auto px-4 mt-16">
              <motion.h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-white" variants={fadeInUp}>
                Role-Specific Features
              </motion.h3>
              <div className="grid md:grid-cols-2 gap-8">
                {/* Researcher Features */}
                <motion.div id="for-researchers" className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20"
                  variants={fadeInUp}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <h4 className="text-xl font-semibold mb-4 text-white">For Researchers</h4>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-400 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Create and manage research projects with milestones
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-400 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Track project funding and expenses
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-400 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Request expert reviews and feedback
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-400 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Real-time chat and collaboration tools
                    </li>
                  </ul>
                </motion.div>

                {/* Reviewer Features */}
                <motion.div id="for-reviewers" className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20"
                  variants={fadeInUp}
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                >
                  <h4 className="text-xl font-semibold mb-4 text-white">For Reviewers</h4>
                  <ul className="space-y-3 text-gray-300">
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-400 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Manage and track review requests
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-400 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Access project documents and materials
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-400 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Review history and analytics dashboard
                    </li>
                    <li className="flex items-start">
                      <svg className="w-5 h-5 text-green-400 mr-2 mt-1" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                      </svg>
                      Direct communication with researchers
                    </li>
                  </ul>
                </motion.div>
              </div>
            </motion.div>
          </section>

          {/* Advanced Features */}
          <motion.div className="container mx-auto px-4 mt-16">
            <motion.h3 className="text-2xl md:text-3xl font-bold text-center mb-8 text-white" variants={fadeInUp}>
              Advanced Capabilities
            </motion.h3>
            <div className="grid md:grid-cols-2 gap-8">
              <motion.div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20"
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <h4 className="text-xl font-semibold mb-4 text-white">Project Management</h4>
                <ul className="space-y-3 text-gray-300">
                  <li>• Set and track project milestones and goals</li>
                  <li>• Real-time progress monitoring</li>
                  <li>• Collaborative document management</li>
                  <li>• Version control and change tracking</li>
                  <li>• Customizable project workflows</li>
                </ul>
              </motion.div>

              <motion.div className="bg-white/10 backdrop-blur-md p-6 rounded-xl border border-white/20"
                variants={fadeInUp}
                whileHover={{ y: -5, transition: { duration: 0.2 } }}
              >
                <h4 className="text-xl font-semibold mb-4 text-white">Communication & Collaboration</h4>
                <ul className="space-y-3 text-gray-300">
                  <li>• Integrated messaging system</li>
                  <li>• Real-time notifications</li>
                  <li>• Group chat functionality</li>
                  <li>• File sharing and collaboration</li>
                  <li>• Review request management</li>
                </ul>
              </motion.div>
            </div>
          </motion.div>
        </section>

        {/* Call to Action Section */}
        <motion.section
          className="py-16 bg-white/5 backdrop-blur-md"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
        >
          <section className="container mx-auto px-4 text-center">
            <motion.h2
              className="text-3xl md:text-4xl font-bold text-white mb-6"
              variants={fadeInUp}
            >
              Ready to Accelerate Your Research?
            </motion.h2>
            <motion.p
              className="text-xl text-gray-300 mb-8 max-w-2xl mx-auto"
              variants={fadeInUp}
            >
              Join our growing community of researchers and reviewers collaborating to advance academic excellence.
            </motion.p>
            <motion.button
              onClick={() => navigate("/signup")}
              className="bg-white hover:bg-gray-100 text-blue-600 font-bold py-3 px-8 rounded-lg text-lg shadow-lg"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Sign Up Now
            </motion.button>
          </section>
        </motion.section>
      </section>
    </section>
  );
}
