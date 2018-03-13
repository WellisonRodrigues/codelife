import React, {Component} from "react";
import {translate} from "react-i18next";
import {Link} from "react-router";
import "./Contest.css";

class Contest extends Component {

  constructor(props) {
    super(props);
    this.state = {
      mounted: false
    };
  }

  render() {
    // const {t} = this.props;

    return (
      <div id="contest-container">
        I am a contest stub<br/>
        <Link to="/contest/submit">submit a project</Link>
      </div>
    );
  }
}

export default translate()(Contest);
