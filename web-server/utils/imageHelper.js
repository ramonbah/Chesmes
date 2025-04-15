class ImageHelper {
    static getRandomProfileImageUrl(req) {
        const randomNumber = Math.floor(Math.random() * 21) + 1; // Random number between 1 and 20
        const imageName = `profile${randomNumber}.png`;
        const imageUrl = `public/images/${imageName}`;
        return imageUrl;
    }

    static getImagePath(req, imageUrl) {
        return `${req.protocol}://${req.get('host')}/` + imageUrl;
    }

}

module.exports = ImageHelper