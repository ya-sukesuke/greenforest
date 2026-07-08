/* =========================================
   Accordion
========================================= */

const accordionButtons = document.querySelectorAll(".accordion-button");

accordionButtons.forEach(button => {

    button.addEventListener("click", () => {

        const content = button.nextElementSibling;

        // 開閉
        if(content.style.display === "block"){

            content.style.display = "none";
            button.textContent = "▼ 詳しく見る";

        }else{

            content.style.display = "block";
            button.textContent = "▲ 閉じる";

        }

    });

});


/* =========================================
   Scroll Animation
========================================= */

const sections = document.querySelectorAll("section");

const observer = new IntersectionObserver((entries)=>{

    entries.forEach(entry=>{

        if(entry.isIntersecting){

            entry.target.classList.add("show");

        }

    });

},{
    threshold:0.15
});

sections.forEach(section=>{

    section.classList.add("hidden");

    observer.observe(section);

});