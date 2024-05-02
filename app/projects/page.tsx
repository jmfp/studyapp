import Project from "../components/portfolio_projects/project";
import styles from "../sass/components/Container.module.scss";

export default function Projects() {
    return (
      <div className={styles.pageContainer}>
        <div className='grid grid-cols-1 md:grid-cols-2 mt-5 gap-5'>
          <Project 
            image="/images/wheelsmall.png"
            link="https://wagonwheelmadison.com/"
            description="A website built for a local bar that allows for administrators to add upcoming events and users to order food online. Built using Wordpress."
          />
          <Project 
            image="/images/jtd.png"
            link="/"
            description="This is my blog/portfolio website. This is a full-stack application built with Next.js. It is mainly used to replace my dev journals, but also
            provides value to others."
          />
          <Project 
            image="/images/solostudy.png"
            link="https://solostudy-front.onrender.com/"
            description="Solostudy is a full-stack application using the MERN tech stack that allows users to create decks of virtual flashcards so they can study topics
            they are interested in at their own pace and eliminates the need for paper based flashcards and study partners."
          />
          <Project 
            image="/images/pokeback.png"
            link="https://pikaplay.onrender.com/"
            description="Pikaplay is a simple website that consumes the poké API that allows users to find information on each monster. Data includes a sprite image of the monster
            along with information on where to find the monster in each game. The website is built using React."
          />
        </div>
      </div>
    );
  }