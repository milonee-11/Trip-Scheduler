import React, { useState, useEffect, useRef } from "react";
import "./AboutMain.css";
import Navbar from "./Navbar";
import FooterSection from "./FooterSection";
import BackToTop from "./BackToTop";


// Custom SVG icons for mission points
const IconCraftsmanship = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="#e06d26"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M3 21v-2l7-7 5 5 7-7V3h-3l-7 7-5-5H3v18z" />
  </svg>
);

const IconHeritage = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="#b35b00"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M12 2L2 7v7c0 5 10 8 10 8s10-3 10-8V7l-10-5z" />
  </svg>
);

const IconFolkCulture = () => (
  <svg
    width="40"
    height="40"
    viewBox="0 0 24 24"
    fill="#f7941d"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <path d="M4 12l1.5 3h9l1.5-3-6-7-6 7z" />
  </svg>
);
const AboutMain = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [menuOpen, setMenuOpen] = useState(false);

  const storyRefs = useRef([]);
  const missionRefs = useRef([]);


  const [visibleStory, setVisibleStory] = useState(Array(4).fill(false));
const [visibleMission, setVisibleMission] = useState(Array(4).fill(false));
  const team = [
    {
      name: "Milonee",
      role: "Founder & Visionary",
      img: "https://img.freepik.com/premium-photo/young-girl-hr-3d-character-young-working-girl-cartoon-character-professional-girl-character_1002350-2147.jpg"
    },
    {
      name: "Ravi",
      role: "UX Lead",
      img: "https://i.pinimg.com/736x/f7/6b/df/f76bdf3a9bb1ada121d3e627bf01b524.jpg"
    },
    {
      name: "Kritika",
      role: "Backend Dev",
      img: "https://static.vecteezy.com/system/resources/previews/030/690/466/non_2x/office-worker-2d-cartoon-illustraton-on-white-background-h-free-photo.jpg"
    },
    {
      name: "Samar",
      role: "Marketing Strategist",
      img: "https://png.pngtree.com/png-clipart/20231016/original/pngtree-businessman-pointing-at-camera-3d-render-businessman-character-illustration-png-image_13321558.png"
    }
  ];

    // Scroll to top when the component loads
    useEffect(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    }, []);

  useEffect(() => {
    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % team.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [team.length]);

 useEffect(() => {
  const observer = new IntersectionObserver(
    (entries) => {
      entries.forEach((entry) => {
        const index = Number(entry.target.getAttribute('data-index'));
        const section = entry.target.getAttribute('data-section');

        if (entry.isIntersecting) {
          requestAnimationFrame(() => {
            if (section === "story") {
              setVisibleStory((prev) => {
                if (prev[index]) return prev;
                const updated = [...prev];
                updated[index] = true;
                return updated;
              });
            } else if (section === "mission") {
              setVisibleMission((prev) => {
                if (prev[index]) return prev;
                const updated = [...prev];
                updated[index] = true;
                return updated;
              });
            }
          });
        }
      });
    },
    {
      threshold: 0.3,
      rootMargin: "0px 0px -10% 0px", // Start transition a bit earlier
    }
  );

  storyRefs.current.forEach((ref) => ref && observer.observe(ref));
  missionRefs.current.forEach((ref) => ref && observer.observe(ref));

  return () => {
    storyRefs.current.forEach((ref) => ref && observer.unobserve(ref));
    missionRefs.current.forEach((ref) => ref && observer.unobserve(ref));
  };
}, []);

  const getPositionClass = (index) => {
    const total = team.length;
    const diff = (index - currentIndex + total) % total;
    if (diff === 0) return "center";
    if (diff === 1 || (currentIndex === total - 1 && index === 0)) return "right";
    if (diff === total - 1 || (currentIndex === 0 && index === total - 1)) return "left";
    return "hidden";
  };

  const scrollToSection = (id) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth" });
    setMenuOpen(false);
  };

  const [expanded, setExpanded] = useState([false, false, false, false]);

  const toggleReadMore = (index) => {
    const newExpanded = [...expanded];
    newExpanded[index] = !newExpanded[index];
    setExpanded(newExpanded);
  };

  const data = [
    {
      year: "2022",
      title: "Launched",
      shortText: "We began our mission to make Rajasthan travel effortless and unforgettable.",
      longText: " With a small but passionate team, we started curating unique travel experiences rooted in culture and comfort. Our aim was to bring authenticity to tourism by showcasing lesser-known gems of Rajasthan.",
    },
    {
      year: "2023",
      title: "Expanded",
      shortText: "Our network grew to 50+ cultural hotspots, creating authentic experiences.",
      longText: " From camel safaris in Jaisalmer to palace stays in Udaipur, we added a range of experiences across cities and towns. Our goal remained simple—connect travelers with locals and traditions.",
    },
    {
      year: "2024",
      title: "Partnered",
      shortText: "Partnered with eco-lodges, guides, and artisans for immersive travel.",
      longText: " We focused on sustainability by supporting eco-tourism. Local artisans, storytellers, and guides became part of our journey, giving travelers a chance to see Rajasthan through authentic eyes.",
    },
    {
      year: "2025",
      title: "Recognized",
      shortText: "Won Best Travel Startup Award for sustainable tourism.",
      longText: " Our commitment to ethical travel and community development was acknowledged nationwide. We’re now setting benchmarks for responsible travel startups across India.",
    }
  ];


  useEffect(() => {
    const revealOnScroll = () => {
      const reveals = document.querySelectorAll(".reveal, .reveal-point");
      reveals.forEach((el) => {
        const windowHeight = window.innerHeight;
        const elementTop = el.getBoundingClientRect().top;
        const revealPoint = 150;
        if (elementTop < windowHeight - revealPoint) {
          el.classList.add("active");
        } else {
          el.classList.remove("active");
        }
      });
    };

    window.addEventListener("scroll", revealOnScroll);
    revealOnScroll();

    return () => window.removeEventListener("scroll", revealOnScroll);
  }, []);

  return (
    <>
      <Navbar />
      

      <div className="about-main rajasthan-theme-bg">
        <div className={`fab right-center ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(!menuOpen)}>
          <div className="fab-icon">☰</div>
          {menuOpen && (
            <div className="fab-menu vertical">
              <button className="fab-btn" onClick={() => scrollToSection("story")} title="About Us">📝</button>
              <button className="fab-btn" onClick={() => scrollToSection("mission")} title="View Our Mission">🎯</button>
              <button className="fab-btn" onClick={() => scrollToSection("journey")} title="See Our Journey">🗺️</button>
              <button className="fab-btn" onClick={() => scrollToSection("team")} title="Meet the Team">👥</button>
            </div>
          )}
        </div>
         {/* About Section */}
     <section className="about-section" id='story'>
  <div className="about-content reveal">
    <h1 className="heading-raj">SMART<br />JOURNEYS</h1>
    <p className="subheading-raj">Plan Your Perfect Journey</p>
    <p className="about-text">
      Our Trip Scheduler helps you craft unforgettable travel itineraries with ease and confidence. 
      Whether you're exploring the vibrant landscapes of Rajasthan or beyond, our platform blends 
      authentic local insights with modern planning tools to make your adventures seamless, personalized, and joyful.
    </p>
    <p className="thanks-text">यात्रा को सरल बनाना हमारा मिशन</p>
    <div className="social-icons" style={{ marginTop: "1px" }}>
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
      <span className="dot"></span>
    </div>
  </div>
  <div className="about-image reveal">
    <img
      src="https://png.pngtree.com/png-clipart/20230414/original/pngtree-rajasthani-colorful-decorative-umbrella-vector-image-png-image_9056199.png"
      alt="Trip Scheduler"
    />
  </div>
</section>


      {/* Mission Section */}
      <section className="mission-section reveal"  id="mission">
       <div
  className="mission-left"
  style={{
    display: "flex",
    justifyContent: "flex-start",
    alignItems: "center",
    paddingLeft: "60px",
    gap: 0, // no gap here because of overlapping
    position: "relative",
    minWidth: 320,
  }}
>
  {/* First image block (in front, slightly right) */}
  <div
    className="reveal"
    style={{
      position: "relative",
      width: 280,
      height: 380,
      borderRadius: 20,
      backgroundImage:
        "url('http://geringerglobaltravel.com/wp-content/uploads/2015/02/DSCN4900-Hawa-mahal-copy.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      boxShadow:
        "0 10px 30px rgba(255, 154, 91, 0.5), inset 0 0 0 8px #b35b00",
      transform: "rotate(-4deg)",
      cursor: "default",
      overflow: "hidden",
      zIndex: 2,
      marginLeft: 40, // space from left edge
      opacity: 0,
      transformOrigin: "left center",
      transition: "opacity 0.8s ease, transform 0.8s ease",
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(135deg, rgba(224,109,38,0.6), rgba(179,91,0,0.7))",
        mixBlendMode: "multiply",
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: 24,
        background:
          "repeating-linear-gradient(45deg, #b35b00, #b35b00 5px, #e06d26 5px, #e06d26 10px)",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        boxShadow: "0 3px 5px rgba(0,0,0,0.2)",
        pointerEvents: "none",
      }}
    />
  </div>

  {/* Second image block (behind, slightly left) */}
  <div
    className="reveal"
    style={{
      position: "absolute",
      width: 280,
      height: 380,
      borderRadius: 20,
      backgroundImage:
        "url('https://4.bp.blogspot.com/-yljY3CY8jLE/U1YF_Pt5tBI/AAAAAAAAE-s/GqmdH2xHQEo/s1600/Jaisalmer+-+BaraBagh.jpg')",
      backgroundSize: "cover",
      backgroundPosition: "center",
      boxShadow:
        "0 10px 30px rgba(224, 109, 38, 0.5), inset 0 0 0 8px #b35b00",
      transform: "rotate(3deg) translateX(-60px)",
      cursor: "default",
      overflow: "hidden",
      zIndex: 1,
      opacity: 0,
      transformOrigin: "left center",
      transition: "opacity 0.8s ease 0.3s, transform 0.8s ease 0.3s",
      left: 0,
      top: 0,
    }}
  >
    <div
      style={{
        position: "absolute",
        inset: 0,
        background:
          "linear-gradient(135deg, rgba(224,109,38,0.6), rgba(179,91,0,0.7))",
        mixBlendMode: "multiply",
        pointerEvents: "none",
      }}
    />
    <div
      style={{
        position: "absolute",
        top: 0,
        left: 0,
        width: "100%",
        height: 24,
        background:
          "repeating-linear-gradient(45deg, #b35b00, #b35b00 5px, #e06d26 5px, #e06d26 10px)",
        borderTopLeftRadius: 20,
        borderTopRightRadius: 20,
        boxShadow: "0 3px 5px rgba(0,0,0,0.2)",
        pointerEvents: "none",
      }}
    />
  </div>
</div>


        <div className="mission-right"  id="mission">
          <h2 className="mission-title">Our Mission</h2>
          <p className="mission-desc">
            Our mission is to immerse travelers in the royal heritage and
            timeless beauty of Rajasthan through authentic experiences,
            vibrant culture, and soulful storytelling.
          </p>

          <div className="mission-points">
            <div className="mission-point reveal-point">
              <div className="mission-icon" aria-label="Art & Craft">
                <IconCraftsmanship />
              </div>
              <div className="mission-text-block">
                <h3>Celebrate Craftsmanship</h3>
                <p>
                  Support artisans and promote traditional handicrafts that
                  reflect Rajasthan’s rich legacy.
                </p>
              </div>
            </div>

            <div className="mission-point reveal-point">
              <div className="mission-icon" aria-label="Heritage">
                <IconHeritage />
              </div>
              <div className="mission-text-block">
                <h3>Preserve Heritage</h3>
                <p>
                  Protect and share Rajasthan’s architectural marvels and
                  historic sites with the world.
                </p>
              </div>
            </div>

            <div className="mission-point reveal-point">
              <div className="mission-icon" aria-label="Folk Music">
                <IconFolkCulture />
              </div>
              <div className="mission-text-block">
                <h3>Promote Folk Culture</h3>
                <p>
                  Foster the living traditions of folk music, dance, and
                  storytelling.
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>


        <section className="timeline-section camel-bg" id="journey">
          <h2 className="timeline-title" >Our Journey</h2>
          <div className="timeline-grid">
            {data.map((item, index) => (
              <div className="timeline-card" key={index}>
                <span className="step">{`0${index + 1}`}</span>
                <h4>{item.title}</h4>
                <p>
                  <strong>{item.year}:</strong> {item.shortText}
                  {expanded[index] && <span>{item.longText}</span>}
                </p>
                <button
                  onClick={() => toggleReadMore(index)}
                  className="read-more-btn"
                >
                  {expanded[index] ? "Read Less" : "Read More"}
                </button>
              </div>
            ))}
          </div>

          
        </section>

        <section id="team" className="team-section" style={{marginBottom:'20px'}}>
          <h2 className="timeline-title" >Meet the Team</h2>
          <div className="carousel-wrapper">
            <div className="carousel-track">
              {team.map((member, idx) => {
                const posClass = getPositionClass(idx);
                if (posClass === "hidden") return null;
                return (
                  <div key={idx} className={`carousel-card ${posClass}`}>
                    <img src={member.img} alt={member.name} />
                    <h4>{member.name}</h4>
                    <p>{member.role}</p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      </div>

      <BackToTop />
      <FooterSection />
    </>
  );
};

export default AboutMain;
