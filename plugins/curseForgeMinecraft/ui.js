import React, { useState, useEffect, useRef } from 'react';
import useSWR from 'swr';
import InputServer from '../../website/components/inputfields/server.js';
import InputFile from '../../website/components/inputfields/file.js';
import InputText from '../../website/components/inputfields/text.js';
import InputConsole from '../../website/components/inputfields/console.js';
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
import PluginName from '../../website/components/pluginComponent/pluginName.js';
import PopupBoxSmall from '../../website/components/button/popupBoxSmall.js';
import * as Lib from "../../website/lib/index.js";

// Helper for save status
function getSavedStatus(plugin, pluginOld) {
    return Lib.equal(plugin.var, pluginOld.var)
}

export default function MinecraftCurseForgeUI(props) {
    const {
        plugin: initialPlugin,
        botId,
        projectAlias,
        mutatePlugins, // Function to refresh the list of all plugins
        openFromStart
    } = props;

    // Local state for UI
    const [open, setOpen] = useState(openFromStart);
    const [infoMessage, setInfoMessage] = useState("");
    const [deleteWindow, setDeleteWindow] = useState(false);
    const [commandInput, setCommandInput] = useState("");

    const {
        data: statusData,
        error: statusError
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

    const isOnline = statusData?.response?.status === "Online";

    // Console logs fetching
    const {
        data: consoleData
    } = useSWR(
        projectAlias ? ['/api/plugins/botRequest', {
            botId: botId,
            command: "pluginApi",
            pluginTag: initialPlugin.pluginTag,
            apiEndpoint: "getConsole",
            pluginId: initialPlugin.pluginId,
            projectAlias: projectAlias
        }] : null,
        getApiFetcher(),
        { refreshInterval: 2000 }
    );

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

    const consoleRef = useRef(null);
    useEffect(() => {
        if (consoleRef.current) {
            consoleRef.current.scrollTop = consoleRef.current.scrollHeight;
        }
    }, [consoleData]);

    const {
        data: pluginWrapper,
        mutate: mutatePlugin
    } = useSWR(
        projectAlias
            ? ['/api/plugins/botRequest', { botId: botId, command: "getOnePlugin", projectAlias: projectAlias, pluginId: initialPlugin.pluginId }]
            : null,
        getApiFetcher()
    );

    if (!pluginWrapper) return <div>Loading Plugin Data...</div>;

    const plugin = pluginWrapper.data;

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
        mutatePlugin();
    };

    const handleButtonClick = async (action, additionalData = {}) => {
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
        mutatePlugin();
        setInfoMessage(returnValue);
    };

    const handleExecuteFile = async (filename) => {
        handleButtonClick('executeFile', { filename });
    };

    const handleSendCommand = async () => {
        if (!commandInput) return;
        await handleButtonClick('sendInput', { input: commandInput });
        setCommandInput("");
    };

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

                        {/* Server Selection */}
                        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #333', borderRadius: '5px' }}>
                            <h3 style={{ marginBottom: '10px' }}>Server Configuration</h3>
                            <InputServer
                                editPlugin={editPlugin}
                                mutatePluginsWrapper={mutatePlugin}
                                botId={botId}
                                pluginId={initialPlugin.pluginId}
                                databaseObject={plugin.var}
                                databasename="server"
                                block={{ description: "Select Server", type: "alone", name: "server_block" }}
                                field={{ name: "server" }}
                            />
                        </div>

                        {/* File Upload */}
                        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #333', borderRadius: '5px' }}>
                            <h3 style={{ marginBottom: '10px' }}>Upload File</h3>
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

                        {/* Owner OP Name */}
                        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #333', borderRadius: '5px' }}>
                            <h3 style={{ marginBottom: '10px' }}>Owner Ingame Name</h3>
                            <InputText
                                editPlugin={editPlugin}
                                mutatePluginsWrapper={mutatePlugin}
                                botId={botId}
                                pluginId={initialPlugin.pluginId}
                                databaseObject={plugin.var}
                                databasename="op"
                                block={{ description: "Owner Name", type: "alone", name: "op_block" }}
                                fieldoptions={{}}
                            />
                        </div>

                        {/* Executables List */}
                        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #333', borderRadius: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0 }}>Executables</h3>
                                <Button text="Refresh" onClick={() => mutateExecutables()} />
                            </div>

                            <Flexbox>
                                {executablesData?.response?.files?.length > 0 ? (
                                    executablesData.response.files.map((file, i) => (
                                        <FlexItem key={i}>
                                            <Button text={file} color="success" onClick={() => handleExecuteFile(file)} />
                                        </FlexItem>
                                    ))
                                ) : (
                                    <div style={{ padding: '10px' }}>No executable files found (.sh, .ps1, .bat)</div>
                                )}
                            </Flexbox>
                        </div>

                        {/* Actions */}
                        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #333', borderRadius: '5px' }}>
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                <h3 style={{ margin: 0 }}>Actions</h3>
                                {/* Status Indicator */}
                                <div style={{
                                    padding: '5px 10px',
                                    borderRadius: '5px',
                                    backgroundColor: isOnline ? '#2ecc71' : '#e74c3c',
                                    color: 'white',
                                    fontWeight: 'bold'
                                }}>
                                    Status: {isOnline ? 'Online' : 'Offline'}
                                </div>
                            </div>
                            <Flexbox>
                                <FlexItem>
                                    <Button text="Verschieben" color="color" onClick={() => handleButtonClick('verschieben')} />
                                </FlexItem>
                                <FlexItem type="spaceLeft">
                                    <Button text="Stop Server" color="delete" onClick={() => handleButtonClick('stopServer')} />
                                </FlexItem>
                                <FlexItem type="spaceLeft">
                                    <Button text="Kill Process" color="delete" onClick={() => handleButtonClick('stopServer')} />
                                </FlexItem>
                            </Flexbox>
                        </div>

                        {/* Console */}
                        <div style={{ marginBottom: '20px', padding: '10px', border: '1px solid #333', borderRadius: '5px' }}>
                            <h3 style={{ marginBottom: '10px' }}>Server Console (Last 50 lines)</h3>
                            <textarea
                                ref={consoleRef}
                                className={utilStyles.textfield} // reusing textfield styles
                                style={{
                                    height: '300px',
                                    fontFamily: 'monospace',
                                    whiteSpace: 'pre-wrap',
                                    backgroundColor: '#1e1e1e',
                                    color: '#d4d4d4',
                                    resize: 'vertical',
                                    marginBottom: '10px'
                                }}
                                value={consoleData?.response ?? "Loading logs..."}
                                readOnly
                            />

                            {/* Input Field for Console */}
                            <Flexbox>
                                <FlexItem type="max">
                                    <input
                                        type="text"
                                        className={utilStyles.textfield}
                                        value={commandInput}
                                        onChange={(e) => setCommandInput(e.target.value)}
                                        onKeyDown={(e) => { if (e.key === 'Enter') handleSendCommand() }}
                                        placeholder="Send command to server..."
                                    />
                                </FlexItem>
                                <FlexItem>
                                    <Button text="Send" color="color" onClick={handleSendCommand} />
                                </FlexItem>
                            </Flexbox>
                        </div>
                    </div>
                    {/* CUSTOM UI CONTENT ENDS HERE */}
                </div>
            </PopupBoxSmall>
        </>
    );
}
