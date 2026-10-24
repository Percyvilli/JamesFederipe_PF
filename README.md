# James Federipe — Portfolio

A static, responsive portfolio built with HTML, CSS, and JavaScript. No package installation or build step is required.

## Preview on this computer

Open `index.html` in a browser, or open PowerShell in this folder and run:

```powershell
py -m http.server 8000
```

Then visit `http://localhost:8000/`. The Smart Parking hardware demo plays locally from `assets/videos/`.

## Push to GitHub

This folder is initialized as a local Git repository and the website files are staged. The large Smart Parking video is intentionally ignored by Git so it cannot block the push.

### If this will be a new portfolio repository

1. On GitHub, create a new **empty** repository. Do not add a README, license, or `.gitignore` there.
2. In PowerShell in this folder, set the remote URL to the URL GitHub shows (replace the example):

   ```powershell
   git remote add origin https://github.com/YOUR-USERNAME/YOUR-REPOSITORY.git
   git status --short
   git check-ignore -v assets/videos/EDP_SmartParking_Demonstration.mp4
   git commit -m "Publish portfolio site"
   git push -u origin main
   ```

3. In GitHub, open the repository's **Settings → Pages**, select **Deploy from a branch**, choose `main` and `/(root)`, and save.
4. Visit the Pages URL shown in Settings after deployment. The canonical link and sitemap are set for `https://percyvilli.github.io/JamesFederipe_PF/`.

### If updating the existing portfolio repository

Clone the existing portfolio repository with GitHub Desktop, then copy the website files from this folder into that clone. Do not copy the hidden `.git` folder. Commit and push the changes from GitHub Desktop; this keeps the existing repository history. Make sure you select the portfolio repository, not the MediSync application repository.

If Git says your name or email is missing, set them once with `git config --global user.name "Your Name"` and `git config --global user.email "you@example.com"`, then retry the commit.

## Parking demo on the public site

The original hardware video is kept in this folder for local preview, but `.gitignore` excludes it from the push. GitHub blocks regular Git files over 100 MiB, and GitHub Pages does not serve Git LFS files. The page hides the local player if the video is unavailable online. To show it publicly, host the clip on a video host or object storage, then replace the video source in `index.html` with that host's embed or direct MP4 URL.

## Site contents

The root contains only the files used by the portfolio, its referenced images and documents, the five short video samples, and this guide. The MediSync research preview uses four selected pages and one blurred teaser inside a scrollable popup; the full manuscript is not included.



