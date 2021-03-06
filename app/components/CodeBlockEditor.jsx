import axios from "axios";
import {connect} from "react-redux";
import React, {Component} from "react";
import {translate} from "react-i18next";
import PropTypes from "prop-types";
import CodeEditor from "components/CodeEditor/CodeEditor";
import {Alert, Dialog, EditableText, Intent, Position, Tabs2, Tab2, Toaster} from "@blueprintjs/core";

import LoadingSpinner from "components/LoadingSpinner";
import ShareDirectLink from "components/ShareDirectLink";
import ShareFacebookLink from "components/ShareFacebookLink";

import "./Studio.css";
import "./CodeBlockEditor.css";

/** 
 * CodeBlockEditor is the popover that comes up for the final test of an island.
 * It is mostly a wrapper around CodeEditor that provides the student with the test prompt,
 * cheat sheet, and db routes to save their progress when they pass the test
 */

class CodeBlockEditor extends Component {

  constructor(props) {
    super(props);
    this.state = {
      mounted: false,
      initialContent: "",
      isPassing: false,
      execState: false,
      isOpen: false,
      goodRatio: 0,
      intent: null,
      rulejson: null,
      resetAlert: false,
      saving: false,
      canPostToFacebook: true,
      filename: "",
      originalFilename: "",
      activeTabId: "codeblockeditor-prompt-tab"
    };
    this.handleKey = this.handleKey.bind(this); // keep this here to scope shortcuts to this page
  }

  /**
   * On Mount, parse various props passed down and add them to state. 
   */
  componentDidMount() {
    const {t} = this.props;
    const rulejson = JSON.parse(this.props.island.rulejson);
    let initialContent = "";
    let filename = "";
    let originalFilename = "";
    if (this.props.island.initialcontent) initialContent = this.props.island.initialcontent;
    if (this.props.island.codeBlock) {
      initialContent = this.props.island.codeBlock.studentcontent;
      filename = this.props.island.codeBlock.snippetname;
      originalFilename = filename;
    }
    else {
      filename = t("myCodeblock", {islandName: this.props.island.name});
      originalFilename = filename;
    }
    this.setState({mounted: true, initialContent, filename, originalFilename, rulejson});

    // start listening for keypress when entering the page
    document.addEventListener("keypress", this.handleKey);
  }

  // stop listening for keypress when leaving the page
  componentWillUnmount() {
    document.removeEventListener("keypress", this.handleKey);
    clearTimeout(this.timeout);
  }

  /**
   * When a user passes a codeblock for the first time, the parent Island component
   * must be informed so it can close the popover and show a the "next island" dialog.
   * Pass this callback down to codeeditor to enable that
   */
  onFirstCompletion(winMessage) {
    this.props.onFirstCompletion(winMessage);
  }

  /**
   * Callback passed to CodeEditor so that CodeEditor can report when the user is using
   * a script tag (therefore show an execute button in here in CodeBlockEditor)
   */
  setExecState(execState) {
    this.setState({execState});
  }

  /**
   * Write progress to db when codeblock is passed
   */
  saveProgress(level) {
    // Status is completed because there is no way to "skip" a codeblock
    axios.post("/api/userprogress/save", {level, status: "completed"}).then(resp => {
      resp.status === 200 ? console.log("successfully saved progress") : console.log("error");
    });
  }

  /**
   * Callback passed down to the CodeEditor, allowing this parent component to respond
   * to text changes if desired.
   */
  onChangeText() {
    // nothing yet
  }

  /** 
   * Set codeblock back to original test prompt state
   */
  resetCodeBlock() {
    const {island} = this.props;
    let initialcontent = "";
    if (island && island.initialcontent) initialcontent = island.initialcontent;
    // This is why CodeEditor needs withRef:true - There are times when the outer wrapping
    // component must reach into the CodeEditor and set its state directly.
    this.editor.getWrappedInstance().getWrappedInstance().setEntireContents(initialcontent);
    this.setState({resetAlert: false});
  }

  /**
   * Show popup warning (Are you sure?)
   */
  attemptReset() {
    this.setState({resetAlert: true});
  }

  /**
   * Show popup warning (Are you sure?)
   */
  executeCode() {
    this.editor.getWrappedInstance().getWrappedInstance().executeCode();
  }

  /**
   * Change codeblock name in place. Note that this doesn't save it to the db yet
   */
  changeCodeblockName(newName) {
    newName = newName.replace(/^\s+|\s+$/gm, "").replace(/[^a-zA-ZÀ-ž0-9-\ _]/g, "");
    const originalFilename = newName;
    const filename = newName;
    this.setState({originalFilename, filename});
  }

  /** 
   * Intermediary function that blocks some editing functions until the save is complete
   * This gets around a known bug where clicking save twice can write two copies to the db
   */
  clickSave() {
    const saving = true;
    this.setState({saving}, this.verifyAndSaveCode.bind(this));
  }

  /** 
   * When the user clicks save & submit, make sure the internal CodeEditor has verified that
   * their code is passing. If so, write the codeblock and progress to the db, and update the 
   * in-state version to reflect the new code
   */
  verifyAndSaveCode() {
    const {t} = this.props;
    const {id: uid} = this.props.auth.user;
    const studentcontent = this.editor.getWrappedInstance().getWrappedInstance().getEntireContents();
    let codeBlock = this.props.island.codeBlock;
    const iid = this.props.island.id;
    let name = t("myCodeblock", {islandName: this.props.island.name});

    if (!this.editor.getWrappedInstance().getWrappedInstance().isPassing()) {
      const toast = Toaster.create({className: "submitToast", position: Position.TOP_CENTER});
      toast.show({message: t("Can't save non-passing code!"), timeout: 1500, intent: Intent.DANGER});
      this.setState({filename: this.state.originalFilename, saving: false});
      return;
    }

    this.saveProgress(iid);

    // todo: maybe replace this with findorupdate from userprogress?
    // this regex trims leading and trailing spaces from the filename and removes URL-breaking characters
    if (this.state.filename !== "") name = this.state.filename.replace(/^\s+|\s+$/gm, "").replace(/[^a-zA-ZÀ-ž0-9-\ _]/g, "");
    let endpoint = "/api/codeBlocks/";
    codeBlock ? endpoint += "update" : endpoint += "new";
    const username = this.props.auth.user.username;
    axios.post(endpoint, {uid, username, iid, name, studentcontent}).then(resp => {
      if (resp.status === 200) {
        this.setState({saving: false, canPostToFacebook: false});
        this.timeout = setTimeout(() => this.setState({canPostToFacebook: true}), 6000);
        const toast = Toaster.create({className: "saveToast", position: Position.TOP_CENTER});
        toast.show({message: t("Saved!"), timeout: 1500, intent: Intent.SUCCESS});
        if (this.editor) this.editor.getWrappedInstance().getWrappedInstance().setChangeStatus(false);

        if (this.props.onFirstCompletion && !codeBlock) this.props.onFirstCompletion();

        if (codeBlock) {
          // If there's already a snippet, and we've saved new data down to the
          // database, we need to update our "in-memory" snippet to reflect the
          // db changes.  We then call parent.handleSave to put this updated snippet
          // back into currentLesson.snippet, saving us a db call.
          codeBlock.studentcontent = studentcontent;
          codeBlock.snippetname = name;
          codeBlock.slug = resp.data.slug;
        }
        else {
          codeBlock = resp.data;
        }
        if (this.props.handleSave) this.props.handleSave(codeBlock);
      }
      else {
        this.setState({saving: false});
        alert(t("Error"));
      }
    });
  }

  handleTabChange(activeTabId) {
    this.setState({activeTabId});
  }

  handleKey(e) {
    // cmd+s = save
    // if (e.key === "s" && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) { // should work, but doesn't override browser save dialog
    if (e.key === "s" && e.ctrlKey) {
      e.preventDefault();
      this.verifyAndSaveCode();
    }
    // else if (e.key === "e" && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) { // should work, but doesn't override browser URL bar focus
    else if (e.key === "e" && e.ctrlKey) {
      e.preventDefault();
      this.executeCode(); // NOTE: doesn't work when editor has focus
    }
    // else if (e.key === "r" && (navigator.platform.match("Mac") ? e.metaKey : e.ctrlKey)) { // should work, but doesn't override browser refresh
    else if (e.key === "r" && e.ctrlKey) {
      e.preventDefault();
      this.attemptReset();
    }
  }

  render() {
    const {t, island, readOnly} = this.props;
    const {activeTabId, execState, initialContent, rulejson, filename, originalFilename, saving, canPostToFacebook} = this.state;

    const {origin} = this.props.location;
    const {username} = this.props.auth.user;

    // get share link, if in edit view
    let shareLink = "";
    const {codeBlock} = this.props.island;
    readOnly || !codeBlock ? shareLink = "" : shareLink = encodeURIComponent(`${origin}/codeBlocks/${username}/${codeBlock.slug ? codeBlock.slug : codeBlock.snippetname}`);

    if (!this.state.mounted) return <LoadingSpinner />;

    // prompt
    const promptTab =
    <div className="codeblockeditor-prompt"
      id="codeblockeditor-prompt"
      dangerouslySetInnerHTML={{__html: island.prompt}}
    />;

    // cheatsheet
    const cheatsheetTab =
    <div className="codeblockeditor-cheatsheet"
      id="codeblockeditor-cheatsheet"
      dangerouslySetInnerHTML={{__html: island.cheatsheet}}
    />;


    return (
      <div className="codeblockeditor-container" id="codeBlock">

        {/* body */}
        <div className="studio-body codeblockeditor-body">

          {/* controls, if not read only */}
          { !readOnly
            ? <div className="studio-controls">

              {/* page title */}
              <h1 className="font-sm">{ island.name } { t("codeblock") }</h1>

              {/* codeblock title */}
              <h2 className="studio-title font-lg">
                <EditableText
                  value={filename}
                  selectAllOnFocus={true}
                  onChange={t => this.setState({filename: t})}
                  onCancel={() => this.setState({filename: originalFilename})}
                  onConfirm={this.changeCodeblockName.bind(this)}
                  multiline={true}
                  // disabled={!canEditTitle}
                  confirmOnEnterKey={true}
                />
              </h2>

              {/* actions title */}
              <h3 className="studio-subtitle font-xs u-margin-bottom-off">{t("Actions")}</h3>

              {/* list of actions */}
              <ul className="studio-action-list font-xs u-list-reset">

                {/* save & submit codeblock */}
                <li className="studio-action-item">
                  <button disabled={saving} className="studio-action-button u-unbutton link" onClick={this.clickSave.bind(this)} key="save">
                    <span className="studio-action-button-icon pt-icon pt-icon-floppy-disk" />
                    <span className="studio-action-button-text u-hide-below-xxs">{ t("Save & Submit") }</span>
                  </button>
                </li>

                {/* execute code */}
                <li className="studio-action-item">
                  <button
                    className={ `studio-action-button u-unbutton link ${!execState && " is-disabled"}` }
                    onClick={this.executeCode.bind(this)}
                    tabIndex={!execState && "-1"}>
                    <span className="studio-action-button-icon pt-icon pt-icon-refresh" />
                    <span className="studio-action-button-text u-hide-below-xxs">{ t("CodeBlockEditor.Execute") }</span>
                  </button>
                </li>

                {/* share codeblock */}
                {shareLink && <li className="studio-action-item">
                  <button className="studio-action-button u-unbutton link" onClick={() => this.setState({isShareOpen: true})}>
                    <span className="studio-action-button-icon pt-icon pt-icon-share" />
                    <span className="studio-action-button-text u-hide-below-xxs">{ t("CodeBlockEditor.Share") }</span>
                  </button>
                </li>
                }

                {/* reset codeblock */}
                <li className="studio-action-item">
                  <button className="studio-action-button u-unbutton link danger-text" onClick={this.attemptReset.bind(this)}>
                    <span className="studio-action-button-icon pt-icon pt-icon-undo" />
                    <span className="studio-action-button-text u-hide-below-xxs">{t("CodeBlockEditor.Reset")}</span>
                  </button>
                </li>

              </ul>


              {/* help text */}
              <div className="codeblockeditor-text font-xs u-margin-top-lg">

                {/* tab between prompt and cheatsheet */}
                <Tabs2
                  id="codeblockeditor-tabs"
                  onChange={ this.handleTabChange.bind(this) }
                  selectedTabId={activeTabId}>
                  <Tab2 id="codeblockeditor-prompt-tab" title={ t("Prompt") } panel={ promptTab } />
                  <Tab2 id="codeblockeditor-cheatsheet-tab" title={ t("Cheatsheet") } panel={ cheatsheetTab } />
                  <Tabs2.Expander />
                </Tabs2>

              </div>
            </div>


            // prompt only if readOnly
            : <div className="studio-controls is-read-only">
              <div className="codeblockeditor-text u-margin-top-sm">

                {/* tab between prompt and cheatsheet */}
                <Tabs2
                  id="codeblockeditor-tabs"
                  onChange={ this.handleTabChange.bind(this) }
                  selectedTabId={activeTabId}>
                  <Tab2 id="codeblockeditor-prompt-tab" title={ t("Prompt") } panel={ promptTab } />
                  <Tab2 id="codeblockeditor-cheatsheet-tab" title={ t("Cheatsheet") } panel={ cheatsheetTab } />
                  <Tabs2.Expander />
                </Tabs2>

              </div>
            </div>
          }


          {/* editor */}
          <div className="studio-editor">
            { this.state.mounted
              ? <CodeEditor
                readOnly={this.props.readOnly}
                ref={c => this.editor = c}
                setExecState={this.setExecState.bind(this)}
                rulejson={rulejson}
                onChangeText={this.onChangeText.bind(this)}
                initialValue={initialContent} />
              : <div className="code-editor" /> // placeholder container
            }
          </div>
        </div>


        {/* reset alert */}
        <Alert
          className="alert-container form-container"
          isOpen={ this.state.resetAlert }
          cancelButtonText={ t("Cancel") }
          confirmButtonText={ t("buttonReset") }
          intent={ Intent.DANGER }
          onCancel={ () => this.setState({resetAlert: false}) }
          onConfirm={ () => this.resetCodeBlock() }>
          <p className="font-lg u-margin-top-off u-margin-bottom-md">{ t("Are you sure you want to reset the code to its original state?") }</p>
        </Alert>


        {/* share dialog triggered by share button */}
        <Dialog
          isOpen={this.state.isShareOpen}
          onClose={() => this.setState({isShareOpen: false})}
          title={t("Share your Project")}
          className="share-dialog form-container u-text-center"
        >

          <h2 className="share-heading font-lg u-margin-bottom-off">
            {t("ShareDirectLink.Label")}:
          </h2>

          {/* direct link */}
          <div className="field-container share-direct-link-field-container u-margin-top-off u-margin-bottom-sm">
            <ShareDirectLink link={shareLink} fontSize="font-md" linkLabel={false} />
          </div>

          {/* facebook */}
          <div className="field-container u-margin-top-off">
            <ShareFacebookLink context="codeblock" shareLink={shareLink} screenshotReady={canPostToFacebook} />
          </div>
        </Dialog>

      </div>
    );
  }
}

CodeBlockEditor.contextTypes = {
  browserHistory: PropTypes.object
};

CodeBlockEditor = connect(state => ({
  auth: state.auth,
  location: state.location
}))(CodeBlockEditor);
CodeBlockEditor = translate()(CodeBlockEditor);
export default CodeBlockEditor;
