import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import InputFile from '../../website/components/inputfields/file.js';
import InputText from '../../website/components/inputfields/text.js';
import Button from '../../website/components/button/button.js';
import { apiFetcher, getApiFetcher } from '../../website/lib/apifetcher.js';
import utilStyles from '../../website/styles/utils.module.css';
import pluginComponentStyles from '../../website/components/pluginComponent/pluginComponent.module.css';
import Flexbox from '../../website/components/button/flexbox.js';
import FlexItem from '../../website/components/button/flexItem.js';
import IconCheck from '../../website/components/icons/check.js';
import IconSave from '../../website/components/icons/save.js';
import IconExpandMore from '../../website/components/icons/expandMore.js';
import IconExpandLess from '../../website/components/icons/expandLess.js';
import IconDelete from '../../website/components/icons/delete.js';
import IconClose from '../../website/components/icons/close.js';
import IconPlay from '../../website/components/icons/play.js';
import IconStop from '../../website/components/icons/stop.js';
import IconRefresh from '../../website/components/icons/refresh.js';
import IconPublic from '../../website/components/icons/public.js';
import IconPublicOff from '../../website/components/icons/publicOff.js';
import IconDownload from '../../website/components/icons/download.js';
import PluginName from '../../website/components/pluginComponent/pluginName.js';
import PopupBoxSmall from '../../website/components/button/popupBoxSmall.js';
import * as Lib from "../../website/lib/index.js";

// Helper for save status
function getSavedStatus(plugin, pluginOld) {
    return Lib.equal(plugin.var, pluginOld.var)
}

function ProcessControl({ filename, isRunning, botId, projectAlias, pluginId, pluginTag, setGlobalInfoMessage }) {
    const [consoleOpen, setConsoleOpen] = useState(false);
    const [commandInput, setCommandInput] = useState("");
    const consoleRef = useRef(null);

    // Fetch console only if open
    const { data: consoleData } = useSWR(
        (consoleOpen && projectAlias) ? ['/api/plugins/botRequest', {
            botId: botId,
            command: "pluginApi",
            pluginTag: pluginTag,
            apiEndpoint: "getConsole",
            pluginId: pluginId,
            projectAlias: projectAlias,
            filename: filename
        }] : null,
        getApiFetcher(),
        { refreshInterval: 2000 }
    );

    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [consoleData]);

    const handleAction = async (action, additionalData = {}) => {
        try {
            if (!pluginId) {
                console.error("Plugin ID is undefined");
                if (setGlobalInfoMessage) setGlobalInfoMessage({ infoMessage: "Plugin ID missing", infoStatus: "Error" });
                return;
            }
            const data = await apiFetcher('/plugins/botRequest', {
                botId: botId,
                command: "pluginApi",
                pluginTag: pluginTag,
                apiEndpoint: action,
                pluginId: pluginId,
                projectAlias: projectAlias,
                filename: filename,
                ...additionalData
            });
            const response = (await data.json()).response;
            if (setGlobalInfoMessage && response) setGlobalInfoMessage(response);
            return response;
        } catch (e) {
            console.error(e);
            if (setGlobalInfoMessage) setGlobalInfoMessage({ infoMessage: "Error executing action", infoStatus: "Error" });
        }
    };

    const handleStart = () => handleAction('executeFile', { filename });
    const handleStop = () => handleAction('stopServer', { filename });
    const handleSendInput = async () => {
        await handleAction('sendInput', { input: commandInput });
        setCommandInput("");
    };

    return (
        <div style={{ margin: '6px', marginBottom: '15px', padding: '10px', border: '1px solid var(--dark4)', borderRadius: '5px', backgroundColor: 'var(--dark1)' }}>
            <Flexbox>
                <FlexItem type="max">
                    <div style={{ fontWeight: 'bold', color: '#fff' }}>{filename}</div>
                </FlexItem>
                <FlexItem>
                    <div style={{
                        padding: '5px 10px',
                        borderRadius: '4px',
                        backgroundColor: isRunning ? '#2ecc71' : '#7f8c8d',
                        color: 'white',
                        fontSize: '0.8em',
                        fontWeight: 'bold',
                        marginRight: '10px'
                    }}>
                        {isRunning ? 'Running' : 'Stopped'}
                    </div>
                </FlexItem>
                <FlexItem>
                    {isRunning ? (
                        <Button icon={<IconStop />} color="transparent" onClick={handleStop} />
                    ) : (
                        <Button icon={<IconPlay />} color="transparent" onClick={handleStart} />
                    )}
                </FlexItem>
                <FlexItem>
                    <Button
                        icon={{ false: <IconExpandMore />, true: <IconExpandLess /> }}
                        state={consoleOpen}
                        onClick={() => setConsoleOpen(!consoleOpen)}
                        color="transparent"
                    />
                </FlexItem>
            </Flexbox>

            {consoleOpen && (
                <div style={{ marginTop: '10px' }}>
                    <Flexbox>
                        <FlexItem type="max">
                            <textarea
                                ref={consoleRef}
                                className={utilStyles.textfield}
                                style={{
                                    height: '200px',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre-wrap',
                                    backgroundColor: 'var(--input)',
                                    color: 'var(--white)',
                                    resize: 'vertical',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                                value={consoleData?.response ?? "Loading logs..."}
                                readOnly
                            />
                        </FlexItem>
                    </Flexbox>
                    <Flexbox>
                        <FlexItem type="max">
                            <input
                                type="text"
                                className={utilStyles.textfield}
                                value={commandInput}
                                onChange={(e) => setCommandInput(e.target.value)}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSendInput() }}
                                placeholder={`Command for ${filename}...`}
                                disabled={!isRunning}
                            />
                        </FlexItem>

                    </Flexbox>
                </div>
            )}
        </div>
    );
}


function ServerPropertiesEditor({ botId, projectAlias, pluginId, pluginTag, setGlobalInfoMessage }) {
    const [content, setContent] = useState("");
    const [loading, setLoading] = useState(false);
    const [isOpen, setIsOpen] = useState(false);
    const [message, setMessage] = useState("");

    // Fetch only when open
    const { data: propertiesData, mutate } = useSWR(
        (isOpen && projectAlias) ? ['/api/plugins/botRequest', {
            botId: botId,
            command: "pluginApi",
            pluginTag: pluginTag,
            apiEndpoint: "getServerProperties",
            pluginId: pluginId,
            projectAlias: projectAlias
        }] : null,
        getApiFetcher()
    );

    useEffect(() => {
        if (propertiesData?.response?.content !== undefined) {
            setContent(propertiesData.response.content);
        }
    }, [propertiesData]);

    const handleSave = async () => {
        setLoading(true);
        try {
            const data = await apiFetcher('/plugins/botRequest', {
                botId: botId,
                command: "pluginApi",
                pluginTag: pluginTag,
                apiEndpoint: "saveServerProperties",
                pluginObj: { id: pluginId, pluginTag: pluginTag, botId: botId },
                pluginId: pluginId,
                projectAlias: projectAlias,
                content: content
            });
            const response = (await data.json()).response;
            if (setGlobalInfoMessage && response) setGlobalInfoMessage(response);
            mutate(); // Refresh data
        } catch (e) {
            console.error("Error saving properties:", e);
            if (setGlobalInfoMessage) setGlobalInfoMessage({ infoMessage: "Error saving properties", infoStatus: "Error" });
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ margin: '6px', padding: '10px', border: '1px solid var(--dark4)', borderRadius: '5px', backgroundColor: 'var(--dark2)' }}>
            <Flexbox>
                <FlexItem type="max">
                    <h3 style={{ margin: 0, color: '#fff' }}>Server Properties</h3>
                </FlexItem>
                <FlexItem>
                    <Button
                        icon={{ false: <IconExpandMore />, true: <IconExpandLess /> }}
                        state={isOpen}
                        onClick={() => setIsOpen(!isOpen)}
                        color="transparent"
                    />
                </FlexItem>
            </Flexbox>

            {isOpen && (
                <div style={{ marginTop: '10px' }}>
                    <Flexbox>
                        <FlexItem type="max">
                            <textarea
                                className={utilStyles.textfield}
                                style={{
                                    height: '400px',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre',
                                    backgroundColor: 'var(--input)',
                                    color: 'var(--white)',
                                    resize: 'vertical',
                                    width: '100%',
                                    boxSizing: 'border-box'
                                }}
                                value={content || ""}
                                onChange={(e) => setContent(e.target.value)}
                                placeholder="Loading..."
                            />
                        </FlexItem>
                    </Flexbox>
                    <Flexbox>
                        <FlexItem type="max"></FlexItem>
                        <FlexItem>
                            <Button text="Speichern" color="success" onClick={handleSave} disabled={loading} icon={<IconSave />} />
                        </FlexItem>
                    </Flexbox>
                </div>
            )}
        </div>
    );
}

export default function MinecraftCurseForgeUI(props) {
    const {
        plugin: initialPlugin,
        botId,
        projectAlias,
        mutatePlugins,
        openFromStart
    } = props;

    const [open, setOpen] = useState(openFromStart);
    const [infoMessage, setInfoMessage] = useState("");
    const [deleteWindow, setDeleteWindow] = useState(false);
    const [deleteWorldWindow, setDeleteWorldWindow] = useState(false);

    const {
        data: pluginWrapper,
        mutate: mutatePlugin
    } = useSWR(
        projectAlias
            ? ['/api/plugins/botRequest', { botId: botId, command: "getOnePlugin", projectAlias: projectAlias, pluginId: initialPlugin.pluginId }]
            : null,
        getApiFetcher()
    );

    const plugin = pluginWrapper?.data || initialPlugin;

    // Fetch Status (Running Processes)
    const {
        data: statusData,
        mutate: mutateStatus
    } = useSWR(
        projectAlias ? ['/api/plugins/botRequest', {
            botId: botId,
            command: "pluginApi",
            pluginTag: initialPlugin.pluginTag,
            apiEndpoint: "getStatus",
            pluginId: initialPlugin.pluginId,
            projectAlias: projectAlias
        }] : null,
        getApiFetcher(),
        { refreshInterval: 2000 }
    );

    const runningProcesses = statusData?.response?.runningProcesses || [];
    const extractionProgress = statusData?.response?.extractionProgress || 0;

    // Fetch Executables
    const {
        data: executablesData,
        mutate: mutateExecutables
    } = useSWR(
        projectAlias ? ['/api/plugins/botRequest', {
            botId: botId,
            command: "pluginApi",
            pluginTag: initialPlugin.pluginTag,
            apiEndpoint: "getExecutables",
            pluginId: initialPlugin.pluginId,
            projectAlias: projectAlias
        }] : null,
        getApiFetcher()
    );

    // Fetch World Status
    const {
        data: worldStatusData,
        mutate: mutateWorldStatus
    } = useSWR(
        (projectAlias && plugin.var?.setupComplete) ? ['/api/plugins/botRequest', {
            botId: botId,
            command: "pluginApi",
            pluginTag: initialPlugin.pluginTag,
            apiEndpoint: "checkWorld",
            pluginId: initialPlugin.pluginId,
            projectAlias: projectAlias
        }] : null,
        getApiFetcher()
    );

    const worldExists = worldStatusData?.response?.worldExists || false;

    const handleWorldAction = async (action) => {
        let returnValue = await apiFetcher('/plugins/botRequest', {
            botId: botId,
            command: "pluginApi",
            pluginTag: plugin.pluginTag,
            apiEndpoint: action,
            pluginId: initialPlugin.pluginId,
            projectAlias: projectAlias
        }).then(async (data) => {
            return (await data.json()).response
        });

        if (action === 'uploadWorld' || action === 'deleteWorld') {
            mutateWorldStatus();
            mutatePlugin();
        }

        if (action === 'downloadWorld' && returnValue?.url) {
            window.open(returnValue.url, '_blank');
        }

        setInfoMessage(returnValue);
    };

    const editPlugin = async (key, value, arrayId, arrayKey, command) => {
        let newPlugin = plugin;

        if (!newPlugin.var) newPlugin.var = {};

        if (arrayId == undefined) {
            newPlugin['var'][key] = value
        } else {
            if (command) {
                if (command == "ADD") {
                    if (!Array.isArray(newPlugin['var'][arrayKey])) {
                        newPlugin['var'][arrayKey] = []
                    }
                    newPlugin['var'][arrayKey].push({})
                }
                if (command == "REMOVE") {
                    newPlugin['var'][arrayKey].splice(arrayId, 1);
                }
            } else {
                if (!newPlugin['var'][arrayKey]) newPlugin['var'][arrayKey] = [];
                if (!newPlugin['var'][arrayKey][arrayId]) newPlugin['var'][arrayKey][arrayId] = {};
                newPlugin['var'][arrayKey][arrayId][key] = value
            }
        }

        await apiFetcher('/plugins/botRequest', {
            botId: botId,
            command: "setOnePlugin",
            projectAlias: projectAlias,
            pluginId: initialPlugin.pluginId,
            pluginObj: plugin,
            botId: botId,
        });
        await mutatePlugin();

        // Automatisch nach dem Datei-Upload (Welt)
        if (key === 'worldFile' && value && value !== "") {
            handleWorldAction('uploadWorld');
        }

        // Automatisch nach dem Datei-Upload (Initial Setup)
        if (key === 'file' && value && value !== "") {
            handleGeneralAction('verschieben');
        }
    };

    const handleGeneralAction = async (action, additionalData = {}) => {
        let returnValue = await apiFetcher('/plugins/botRequest', {
            botId: botId,
            command: "pluginApi",
            pluginTag: plugin.pluginTag,
            apiEndpoint: action,
            pluginId: initialPlugin.pluginId,
            projectAlias: projectAlias,
            ...additionalData
        }).then(async (data) => {
            return (await data.json()).response
        });
        if (action === 'verschieben' && returnValue?.saved) {
            await mutatePlugin(current => ({ ...current, data: { ...current.data, var: { ...current.data.var, setupComplete: true } } }), false);
            mutateExecutables();
        }
        await mutatePlugin();
        setInfoMessage(returnValue);
    };


    if (!pluginWrapper) return <div>Loading Plugin Data...</div>;

    return (
        <>
            <Flexbox>
                <FlexItem>
                    {getSavedStatus(plugin, initialPlugin) ?
                        <div className={pluginComponentStyles.saved}><div className={`${pluginComponentStyles.channelIcon}`}><IconCheck /></div></div>
                        :
                        <div className={pluginComponentStyles.unsaved}><div className={`${pluginComponentStyles.channelIcon}`}><IconSave /></div></div>
                    }
                </FlexItem>
                <FlexItem type="max">
                    <PluginName botId={botId} projectAlias={projectAlias} plugin={plugin} mutatePlugin={mutatePlugin} />
                </FlexItem>
                <FlexItem>
                    <Button icon={{ false: <IconExpandMore />, true: <IconExpandLess /> }} color={"light"} state={open} onClick={
                        async () => {
                            setOpen(!open)
                        }}
                    />
                </FlexItem>
                <FlexItem>
                    <Button icon={<IconDelete />} color={"delete"} onClick={
                        async () => {
                            setDeleteWindow(true)
                        }
                    } />
                </FlexItem>
                <FlexItem>
                    <Button text={"reset"} color={"delete"} onClick={
                        async () => {
                            await apiFetcher('/plugins/botRequest', {
                                botId: botId,
                                command: "deleteCache",
                                projectAlias: projectAlias,
                                pluginId: plugin.id
                            });
                            props.mutatePlugins();
                            mutatePlugin();
                        }
                    } />
                </FlexItem>
            </Flexbox>

            {!deleteWindow ? "" :
                <div className={pluginComponentStyles.deleteWindow}>
                    <div className={pluginComponentStyles.deleteWindowDiv}>
                        Plugin Löschen?
                        <br />
                        Bist du sicher das du dieses Plugin Löschen möchtest? Es kann danach nicht wiederhergestellt werden
                    </div>
                    <Flexbox>
                        <FlexItem type="spaceLeft">
                            <Button icon={<IconDelete />} text={"Abbrechen"} color={"light"} onClick={
                                async () => {
                                    setDeleteWindow(false)
                                }}
                            />
                        </FlexItem>
                        <FlexItem>
                            <Button icon={<IconDelete />} text={"Löschen"} color={"delete"} onClick={
                                async () => {
                                    setDeleteWindow(false)
                                    await apiFetcher('/plugins/delete', {
                                        botId: botId,
                                        pluginId: plugin.id,
                                        projectAlias: projectAlias
                                    })
                                    props.mutatePlugins()
                                }}
                            />
                        </FlexItem>
                    </Flexbox>
                </div>}

            {!deleteWorldWindow ? "" :
                <div className={pluginComponentStyles.deleteWindow}>
                    <div className={pluginComponentStyles.deleteWindowDiv}>
                        Welt löschen?
                        <br />
                        Bist du sicher, dass du die Welt löschen möchtest? Alle Welt-Daten gehen verloren.
                    </div>
                    <Flexbox>
                        <FlexItem type="spaceLeft">
                            <Button text={"Abbrechen"} color={"light"} onClick={() => setDeleteWorldWindow(false)} />
                        </FlexItem>
                        <FlexItem>
                            <Button icon={<IconDelete />} text={"Welt unwiderruflich löschen"} color={"delete"} onClick={
                                async () => {
                                    setDeleteWorldWindow(false);
                                    handleWorldAction('deleteWorld');
                                }}
                            />
                        </FlexItem>
                    </Flexbox>
                </div>}

            <PopupBoxSmall open={open}>
                {!infoMessage ? "" :
                    <div className={`
                        ${pluginComponentStyles.infoMessage}
                        ${infoMessage.infoStatus === "Info" ? pluginComponentStyles.infoMessageInfo : ""}
                        ${infoMessage.infoStatus === "Error" ? pluginComponentStyles.infoMessageError : ""}
                    `}>
                        <Flexbox>
                            <FlexItem type="max">
                                <div>{infoMessage.infoMessage}</div>
                            </FlexItem>
                            <FlexItem>
                                <Button icon={<IconClose />} color={"transparent"} onClick={
                                    async () => {
                                        setInfoMessage("")
                                    }}
                                />
                            </FlexItem>
                        </Flexbox>
                    </div>
                }

                <div className={pluginComponentStyles.channelName}>
                    {/* CUSTOM UI CONTENT STARTS HERE */}
                    <div className={utilStyles.pluginContainer}>
                        {extractionProgress > 0 && (
                            <div style={{ marginBottom: '20px', padding: '15px', backgroundColor: '#2a2a2a', border: '1px solid #444', borderRadius: '5px' }}>
                                <div style={{ marginBottom: '10px', fontWeight: 'bold', color: '#fff' }}>Entpacken auf dem Server...</div>
                                <div style={{ width: '100%', height: '12px', backgroundColor: 'var(--dark1)', borderRadius: '6px', overflow: 'hidden' }}>
                                    <div style={{ width: `${extractionProgress}%`, height: '100%', background: 'linear-gradient(90deg, #3498db, #2ecc71)', transition: 'width 0.3s ease' }}></div>
                                </div>
                                <div style={{ textAlign: 'center', marginTop: '5px', color: '#fff', fontSize: '14px' }}>{extractionProgress}%</div>
                            </div>
                        )}

                        {/* File Upload */}
                        {!plugin.var?.setupComplete && (
                            <div style={{ margin: '6px', padding: '10px', border: '1px solid var(--dark4)', borderRadius: '5px', backgroundColor: 'var(--dark2)' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <h3 style={{ margin: 0, color: '#fff' }}>Upload File (Setup)</h3>
                                </div>
                                <InputFile
                                    editPlugin={editPlugin}
                                    mutatePlugin={mutatePlugin}
                                    botId={botId}
                                    pluginId={initialPlugin.pluginId}
                                    databaseObject={plugin.var}
                                    databasename="file"
                                    block={{ description: "File Upload", type: "alone", name: "file_block" }}
                                />
                            </div>
                        )}

                        {plugin.var?.setupComplete && (
                            <>

                                {/* World Management */}
                                <div style={{ margin: '6px', padding: '10px', border: '1px solid var(--dark4)', borderRadius: '5px', backgroundColor: 'var(--dark2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <h3 style={{ margin: 0, color: '#fff' }}>World Management</h3>
                                        <div style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'center',
                                            padding: '4px',
                                            margin: '6px',
                                            borderRadius: '5px',
                                            backgroundColor: worldExists ? '#2ecc71' : '#e74c3c',
                                            color: 'white'
                                        }} title={worldExists ? 'Welt Vorhanden' : 'Keine Welt gefunden'}>
                                            <div style={{ width: '24px', height: '24px' }}>
                                                {worldExists ? <IconPublic /> : <IconPublicOff />}
                                            </div>
                                        </div>
                                    </div>

                                    {worldExists ? (
                                        <Flexbox>
                                            <FlexItem type="max"></FlexItem>
                                            <FlexItem>
                                                <Button icon={<IconDownload />} text="Download" color="success" onClick={() => handleWorldAction('downloadWorld')} />
                                            </FlexItem>
                                            <FlexItem>
                                                <Button icon={<IconDelete />} text="Löschen" color="delete" onClick={() => setDeleteWorldWindow(true)} />
                                            </FlexItem>
                                        </Flexbox>
                                    ) : (
                                        <div>
                                            <InputFile
                                                editPlugin={editPlugin}
                                                mutatePlugin={mutatePlugin}
                                                botId={botId}
                                                pluginId={initialPlugin.pluginId}
                                                databaseObject={plugin.var}
                                                databasename="worldFile"
                                                block={{ description: "Als Welt hochladen (ZIP)", type: "alone", name: "worldFile_block" }}
                                            />
                                        </div>
                                    )}
                                </div>


                                {/* Programs Lists */}
                                <div style={{ margin: '6px', padding: '10px', border: '1px solid var(--dark4)', borderRadius: '5px', backgroundColor: 'var(--dark2)' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                        <h3 style={{ margin: 0, color: '#fff' }}>Programs & Executables</h3>
                                        <Button icon={<IconRefresh />} color="transparent" onClick={() => mutateExecutables()} />
                                    </div>

                                    {executablesData?.response?.files?.length > 0 ? (
                                        executablesData.response.files.map((file, i) => (
                                            <ProcessControl
                                                key={file}
                                                filename={file}
                                                isRunning={runningProcesses.includes(file)}
                                                botId={botId}
                                                projectAlias={projectAlias}
                                                pluginId={initialPlugin.pluginId}
                                                pluginTag={plugin.pluginTag}
                                                setGlobalInfoMessage={setInfoMessage}
                                            />
                                        ))
                                    ) : (
                                        <div style={{ padding: '10px', color: '#888' }}>
                                            No executable files found (.sh, .ps1, .bat). Upload a zip with executables inside.
                                        </div>
                                    )}
                                </div>

                                <ServerPropertiesEditor
                                    botId={botId}
                                    projectAlias={projectAlias}
                                    pluginId={initialPlugin.pluginId}
                                    pluginTag={plugin.pluginTag}
                                    setGlobalInfoMessage={setInfoMessage}
                                />
                            </>
                        )}
                    </div>
                </div>
            </PopupBoxSmall>
        </>
    );
}
