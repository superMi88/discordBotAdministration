import useSWRImmutable from 'swr/immutable'
import useSWR from 'swr'
import React, { useEffect, useState } from "react";
import { useSWRConfig } from 'swr'
import Router from 'next/router'

/*lib*/
import { apiFetcher, getApiFetcher } from '@/lib/apifetcher'

/*Styles*/
import utilStyles from '@/styles/utils.module.css'
import fileUploadStyles from '@/components/inputfields/file.module.css'

import { useRouter } from 'next/router';

let collection = {}

export default function component(props) {

    const [loading, setLoading] = useState(false)

    const [progress, setProgress] = useState(0);

    let fieldnameToUpdate = props.databasename

    const router = useRouter()
    const [projectAlias, setProjectAlias] = useState(false);
    useEffect(() => {
        if (!router.isReady) return;
        setProjectAlias(router.query.projectAlias)
    }, [router.isReady]);

    const dropFile = (e) => {
        // Prevent default behavior (Prevent file from being opened)
        e.preventDefault();

        if (e.dataTransfer.items) {
            for (const [key, value] of Object.entries(e.dataTransfer.items)) {
                if (value.kind === 'file') {
                    var file = value.getAsFile()
                    if (file && (file.name.endsWith('.zip') || file.name.endsWith('.jar'))) {
                        handleUpload(file);
                    } else {
                        alert("Bitte eine ZIP oder JAR Datei hochladen.");
                    }
                }
            }
        }
    }

    const handleFileButton = (e) => {
        // Prevent default behavior
        e.preventDefault();

        if (e.target.files) { // Wenn Dateien ausgewählt wurden
            for (const [key, value] of Object.entries(e.target.files)) {
                if (value.name.endsWith('.zip') || value.name.endsWith('.jar')) {
                    handleUpload(value); // Senden der ZIP-Datei
                } else {
                    alert("Bitte eine ZIP oder JAR Datei hochladen.");
                }
            }
        }
    }

    const dragOverFile = (e) => {
        e.stopPropagation();
        e.preventDefault();
    }

    const handleClick = async (e, textId, fieldnameToUpdate, name, image) => {

        props.editPlugin(fieldnameToUpdate, "", props.arrayId, props.arrayKey)

    };

    // Chunked upload helper
    async function uploadFileInChunks(file) {
        const chunkSize = 4 * 1024 * 1024; // 4 MB
        const totalChunks = Math.ceil(file.size / chunkSize);
        console.log("total chunk sizes: " + totalChunks)
        for (let index = 0; index < totalChunks; index++) {
            console.log("upload chunk " + index)
            const start = index * chunkSize;
            const end = Math.min(start + chunkSize, file.size);
            const chunk = file.slice(start, end);
            const formData = new FormData();
            formData.append('file', chunk);
            formData.append('chunkIndex', index);
            formData.append('totalChunks', totalChunks);
            formData.append('originalName', file.name);
            formData.append('botId', props.botId);
            formData.append('fieldnameToUpdate', fieldnameToUpdate);
            formData.append('name', props.block.name);
            formData.append('projectAlias', projectAlias);
            if (props.databaseObject._id) {
                formData.append('textId', props.databaseObject._id);
            }
            formData.append('pluginId', props.pluginId);

            console.log("start fetch " + index)
            const res = await fetch('/api/plugins/setFile', {
                method: 'POST',
                body: formData
            });
            console.log("end fetch " + index)

            if (!res.ok) throw new Error(`Chunk ${index} upload failed`);
            setProgress(Math.round((index + 1) / totalChunks * 100));
        }
    }

    async function handleUpload(file) {
        setLoading(true);
        setProgress(0);
        try {
            await uploadFileInChunks(file);
            // Final step: update plugin
            props.editPlugin(fieldnameToUpdate, file.name, props.arrayId, props.arrayKey);
            await props.mutatePlugin();
        } catch (err) {
            alert(err.message);
        } finally {
            setLoading(false);
            setProgress(0);
        }
    }


    if (loading) {
        return (
            <div className={fileUploadStyles.fileList}>
                <div className={fileUploadStyles.fileDiv}>
                    <div className={`${utilStyles.loader}`}></div>
                </div>
            </div>
        );
    }

    if (props.databaseObject[props.databasename] === "" || props.databaseObject[props.databasename] === undefined) {
        return (
            <div
                className={fileUploadStyles.fileList}
                onDrop={dropFile}
                onDragOver={dragOverFile}
            >
                <div className={fileUploadStyles.fileDivUploader}>
                    <label className={fileUploadStyles.fileUploadButton} htmlFor="file">
                        Upload ZIP/JAR Datei
                    </label>
                    <input
                        className={utilStyles.hidden}
                        type="file"
                        id="file"
                        name="file"
                        accept=".zip,.jar"
                        onChange={handleFileButton}
                    />
                </div>
                {progress > 0 && (
                    <div className={fileUploadStyles.progressWrapper}>
                        <div
                            className={fileUploadStyles.progressBar}
                            style={{ width: `${progress}%` }}
                        ></div>
                        <span>{progress}%</span>
                    </div>
                )}
            </div>
        );

    }

    return (
        <div className={fileUploadStyles.fileList}>
            <div className={fileUploadStyles.fileDiv}>
                <div>{props.databaseObject[props.databasename]}</div>
                <div className={fileUploadStyles.deleteButton} onClick={(e) => handleClick(e, props.databaseObject._id, props.databasename, props.block.name, props.databaseObject[props.databasename])}>x</div>
            </div>
        </div>
    );
}
