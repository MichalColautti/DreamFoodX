import React from "react";

function Image_slider() {
  const aspectRatio = "5/2"; // Ustaw żądane proporcje

  return (
    <div
      id="carouselExample"
      className="carousel slide w-full max-w-3xl mx-auto"
      data-bs-ride="carousel"
      data-bs-interval="2000"
      data-bs-pause="hover"
    >
      <div
        className="relative w-full overflow-hidden"
        style={{ aspectRatio: aspectRatio }} // Dodaj styl aspectRatio
      >
        {/* Obrazy – będą przycinane, aby dopasować się do proporcji kontenera */}
        <div className="carousel-inner w-full h-full">
          <div className="carousel-item active w-full h-full absolute inset-0">
            <img
              src="/image_slider/img_1.jpg"
              className="w-full h-full object-cover"
              alt="Slider 1"
              width="100%"
            />
          </div>
          <div className="carousel-item w-full h-full absolute inset-0">
            <img
              src="/image_slider/img_2.jpg"
              className="w-full h-full object-cover"
              alt="Slider 2"
              width="100%"
            />
          </div>
          <div className="carousel-item w-full h-full absolute inset-0">
            <img
              src="/image_slider/img_3.jpg"
              className="w-full h-full object-cover"
              alt="Slider 3"
              width="100%"
            />
          </div>
        </div>
      </div>

      {/* Nawigacja */}
      <button
        className="carousel-control-prev"
        type="button"
        data-bs-target="#carouselExample"
        data-bs-slide="prev"
      >
        <span className="carousel-control-prev-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Poprzedni</span>
      </button>

      <button
        className="carousel-control-next"
        type="button"
        data-bs-target="#carouselExample"
        data-bs-slide="next"
      >
        <span className="carousel-control-next-icon" aria-hidden="true"></span>
        <span className="visually-hidden">Następny</span>
      </button>
    </div>
  );
}

export default Image_slider;
