import React from "react";
import {Route, Redirect, IndexRoute, browserHistory} from "react-router";

import App from "./App";

import About from "pages/About";
import EditProfile from "pages/profile/EditProfile";
import Glossary from "pages/Glossary";
import Home from "pages/Home";
import IslandMap from "pages/IslandMap";
import IslandLevel from "pages/IslandLevel";
import Privacy from "pages/Privacy";
import Profile from "pages/profile/Profile";
import Share from "pages/Share";
import Slide from "pages/Slide";
import Projects from "pages/Projects";
import Survey from "pages/Survey";
import LearnMore from "pages/LearnMore";
import AdminPanel from "pages/admin/AdminPanel";
import ResetPw from "pages/ResetPw";
import LessonPlan from "pages/LessonPlan";
import Leaderboard from "pages/Leaderboard";
import Contact from "pages/Contact";
import Error from "pages/Error";

// import Contest from "pages/Contest";

export default function RouteCreate() {

  return (
    <Route path="/" component={App} history={browserHistory}>

      <IndexRoute component={Home} />

      <Route path="island" component={IslandMap} />
      <Route path="island/:lid" component={IslandLevel} />
      <Route path="island/:lid/show" component={IslandLevel} />
      <Route path="island/:lid/:mlid(/:sid)" component={Slide} />

      <Route path="projects/:username" component={Projects} />
      <Route path="projects/:username/:filename" component={Share} />
      <Route path="projects/:user/:filename/edit" component={Projects} />

      <Route path="profile/:username" component={Profile} />
      <Route path="profile/:username/edit" component={EditProfile} />

      <Route path="glossary" component={Glossary} />

      <Route path="survey" component={Survey} />

      <Route path="about" component={About} />

      <Route path="privacy" component={Privacy} />

      <Route path="codeBlocks/:username/:filename" component={Share} />

      <Route path="admin" component={AdminPanel} />
      <Route path="admin/:tab" component={AdminPanel} />
      <Route path="admin/:tab/:island" component={AdminPanel} />
      <Route path="admin/:tab/:island/:level" component={AdminPanel} />
      <Route path="admin/:tab/:island/:level/:slide" component={AdminPanel} />

      <Route path="learnmore" component={LearnMore} />

      {/* <Route path="contest" component={Contest} /> */}

      <Route path="contact" component={Contact} />

      <Route path="lessonplan" component={LessonPlan} />
      <Route path="lessonplan/:lid" component={LessonPlan} />

      <Route path="leaderboard" component={Leaderboard} />

      <Route path="reset" component={ResetPw} />
      <Redirect from="login" to="/" />

      <Route path="*" component={Error} />

    </Route>
  );
}
