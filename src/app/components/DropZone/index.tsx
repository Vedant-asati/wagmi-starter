import React, { useState, useCallback, useEffect } from "react";
import { useDropzone } from "react-dropzone";
import CloudUploadIcon from "@mui/icons-material/CloudUpload";
import { Box, Typography } from "@mui/material";

const DropZone = ({ onFileUploaded, initialPreview }) => {
  const [selectedFileUrl, setSelectedFileUrl] = useState(initialPreview || "");

  const onDrop = useCallback(
    (acceptedFiles) => {
      const file = acceptedFiles[0];
      const fileUrl = URL.createObjectURL(file);

      setSelectedFileUrl(fileUrl);
      onFileUploaded(file);
    },
    [onFileUploaded]
  );

  useEffect(() => {
    if (initialPreview) {
      setSelectedFileUrl(initialPreview);
    }
  }, [initialPreview]);

  const { getRootProps, getInputProps } = useDropzone({
    onDrop,
    accept: "image/*",
  });

  return (
    <Box
      {...getRootProps()}
      sx={{
        height: "350px",
        background: "#e1E4F2",
        borderRadius: "10px",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        mt: 6,
        outline: "none",
        cursor: "pointer",
        "&:hover": {
          backgroundColor: "#d1d4e0",
        },
      }}
    >
      <input {...getInputProps()} accept="image/*" />
      {selectedFileUrl ? (
        <Box
          component="img"
          src={selectedFileUrl}
          alt="NFT thumbnail"
          sx={{
            width: "100%",
            height: "100%",
            objectFit: "cover",
            borderRadius: "10px",
          }}
        />
      ) : (
        <Box
          sx={{
            width: "calc(100% - 60px)",
            height: "calc(100% - 60px)",
            borderRadius: "10px",
            border: "1px dashed #3F51B5",
            display: "flex",
            flexDirection: "column",
            justifyContent: "center",
            alignItems: "center",
            color: "#333",
          }}
        >
          <CloudUploadIcon sx={{ color: "#3F51B5", mb: 1, fontSize: 24 }} />
          <Typography>NFT image</Typography>
        </Box>
      )}
    </Box>
  );
};

export default DropZone;
