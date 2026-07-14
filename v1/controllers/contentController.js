import StaticContent from "../models/StaticContent.js";

// @route   GET /v1/content
// @desc    Get all content for a specific page or all pages
// @access  Public
export async function GetContent(req, res) {
    try {
        const { page } = req.query;
        let query = {};
        if (page) {
            query.page = page;
        }

        const contents = await StaticContent.find(query).lean();
        
        // Convert to key-value pairs for easy frontend consumption
        const contentMap = {};
        contents.forEach(item => {
            contentMap[item.sectionKey] = item.contentValue;
        });

        res.status(200).json({
            status: true,
            code: 200,
            data: contentMap,
            message: "Content fetched successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: false,
            code: 500,
            message: "Internal Server Error",
        });
    }
}

// @route   GET /v1/admin/content
// @desc    Get all content as list
// @access  Private/Admin
export async function AdminListContent(req, res) {
    try {
        const contents = await StaticContent.find().sort({ updatedAt: -1 });
        res.status(200).json({
            status: true,
            code: 200,
            data: contents,
            message: "Success",
        });
    } catch (err) {
        res.status(500).json({ status: false, code: 500, message: "Server Error" });
    }
}

// @route   POST /v1/admin/content
// @desc    Create or update content block
// @access  Private/Admin
export async function UpsertContent(req, res) {
    try {
        const { page, sectionKey, contentValue } = req.body;

        if (!page || !sectionKey || contentValue === undefined) {
            return res.status(400).json({
                status: false,
                code: 400,
                message: "page, sectionKey, and contentValue are required",
            });
        }

        let content = await StaticContent.findOne({ sectionKey });

        if (content) {
            content.contentValue = contentValue;
            content.page = page;
            await content.save();
        } else {
            content = new StaticContent({ page, sectionKey, contentValue });
            await content.save();
        }

        res.status(200).json({
            status: true,
            code: 200,
            data: content,
            message: "Content saved successfully",
        });
    } catch (err) {
        console.error(err);
        res.status(500).json({
            status: false,
            code: 500,
            message: "Internal Server Error",
        });
    }
}

// @route   DELETE /v1/admin/content/:id
// @desc    Delete content block
// @access  Private/Admin
export async function DeleteContent(req, res) {
    try {
        const { id } = req.params;
        await StaticContent.findByIdAndDelete(id);
        res.status(200).json({
            status: true,
            code: 200,
            message: "Content deleted successfully",
        });
    } catch (err) {
        res.status(500).json({ status: false, code: 500, message: "Server Error" });
    }
}
