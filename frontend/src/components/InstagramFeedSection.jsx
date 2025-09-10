import React from "react";

const InstagramFeedSection = () => {
  const images = [
   'https://tse3.mm.bing.net/th?id=OIP.XuY2FME-qDN6lq5OUI3zqQHaDO&pid=Api&P=0&h=180',
    'https://fthmb.tqn.com/cHkm_dCPiPqETGHqv-rTddx6D_E=/960x0/filters:no_upscale()/facade-of-the-hawa-mahal-palace-of-winds-in-jaipur-rajasthan-india-636950806-58e24eed5f9b58ef7e556bbb.jpg',
    'https://imgcld.yatra.com/ytimages/image/upload/v1462942314/Jaisalmer_History.jpg',
    'https://yehaindia.com/wp-content/uploads/2020/07/Rajasthani-Dance-3.jpg',
    "https://static.toiimg.com/thumb/msid-26858800,width=1200,height=900/26858800.jpg",
    "https://www.andbeyond.com/wp-content/uploads/sites/5/rajasthan-camels-desert-india.gif",
    'https://media.cntraveller.in/wp-content/uploads/2017/02/lead28-866x487.jpg'
  ];

  return (
    <section className="insta-strip">
      <div className="slider">
        <div className="slide-track">
          {images.concat(images).map((src, index) => (
            <div className="slide" key={index}>
              <img src={src} alt={`Insta ${index}`} />
            </div>
          ))}
        </div>
      </div>

      <style jsx>{`
        .insta-strip {
          width: 100%;
          overflow: hidden;
          background: linear-gradient(to bottom, #fffaf0, #ffe6e6);
          padding: 40px 0;
        }

        .slider {
          position: relative;
          width: 100%;
        }

        .slide-track {
          display: flex;
          width: calc(300px * 12);
          animation: scroll 60s linear infinite;
        }

        .slide {
          width: 300px;
          margin: 0 10px;
          transition: transform 0.5s;
          perspective: 1000px;
        }

        .slide img {
          width: 100%;
          height: 200px;
          object-fit: cover;
          border-radius: 20px;
          transform: rotateY(0deg);
          transition: transform 0.6s ease, box-shadow 0.4s ease;
        }

        .slide img:hover {
          transform: rotateY(15deg) scale(1.05);
          box-shadow: 0 15px 30px rgba(0, 0, 0, 0.3);
        }

        @keyframes scroll {
          0% {
            transform: translateX(0);
          }
          100% {
            transform: translateX(-50%);
          }
        }

        @media (max-width: 768px) {
          .slide-track {
            width: calc(250px * 12);
          }

          .slide {
            width: 250px;
          }

          .slide img {
            height: 180px;
          }
        }
      `}</style>
    </section>
  );
};

export default InstagramFeedSection;
