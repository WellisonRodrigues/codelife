import React, {Component} from "react";

export default class QuillWrapper extends Component {

  render() {
    if (typeof window !== "undefined") {
      const Quill = require("react-quill");
      require("react-quill/dist/quill.snow.css");
      const modules = {
        toolbar: [
          ["bold", "italic", "underline", "code", "blockquote", "code-block", "link"],
          [{list: "ordered"}, {list: "bullet"}],
          ["clean"]
        ],
        clipboard: {
          matchVisual: false
        }
      };
      return <Quill
        theme="snow"
        modules={modules}
        ref={c => this.quillRef = c}
        {...this.props} 
      />;
    }
    return null;
  }
}
