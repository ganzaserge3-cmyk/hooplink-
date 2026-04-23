const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME ?? "";
const uploadPreset = process.env.NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET ?? "";

function assertCloudinaryConfigured() {
  if (!cloudName || !uploadPreset) {
    throw new Error(
      "Cloudinary is not configured. Add NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME and NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET."
    );
  }
}

export async function uploadToCloudinary(file: File, folder: string, onProgress?: (progress: number) => void) {
  assertCloudinaryConfigured();

  const formData = new FormData();
  formData.append("file", file);
  formData.append("upload_preset", uploadPreset);
  formData.append("folder", folder);

  return new Promise<{ url: string; publicId: string; resourceType: string }>((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener("progress", (event) => {
      if (event.lengthComputable && onProgress) {
        const progress = (event.loaded / event.total) * 100;
        onProgress(progress);
      }
    });

    xhr.addEventListener("load", () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText) as {
            secure_url?: string;
            public_id?: string;
            resource_type?: string;
            error?: { message?: string };
          };

          if (data.secure_url) {
            resolve({
              url: data.secure_url,
              publicId: data.public_id ?? "",
              resourceType: data.resource_type ?? "image",
            });
          } else {
            reject(new Error(data.error?.message || "Cloudinary upload failed."));
          }
        } catch (error) {
          reject(new Error("Invalid response from Cloudinary."));
        }
      } else {
        reject(new Error(`Upload failed with status ${xhr.status}.`));
      }
    });

    xhr.addEventListener("error", () => {
      reject(new Error("Network error during upload."));
    });

    xhr.addEventListener("timeout", () => {
      reject(new Error("Upload timed out."));
    });

    xhr.timeout = 5 * 60 * 1000; // 5 minutes timeout

    xhr.open("POST", `https://api.cloudinary.com/v1_1/${cloudName}/auto/upload`);
    xhr.send(formData);
  });
}
