const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const path = require("path");



const app = express();
const port = 3000;

// Middleware
app.use(bodyParser.json());
app.use(cors());

// Serve static frontend files
app.use(express.static(path.join(__dirname, "public")));

// Question Tree
const questionTree = {
    start: {
        question: "Hello! How can I assist you today?",
        options: [
            { id: "billing", text: "Billing Issues" },
            { id: "tech_support", text: "Technical Support" },
            { id: "product", text: "Product Inquiry" },
            { id: "other", text: "Other" },
        ],
    },
    billing: {
        question: "What kind of billing issue are you experiencing?",
        options: [
            { id: "missing_bill", text: "I didn’t receive my bill." },
            { id: "wrong_amount", text: "The bill amount is incorrect." },
            { id: "payment_help", text: "I need help with payment options." },
            { id: "manual_response", text: "Other" },
        ],
    },
    missing_bill: {
        question: "Did you check your email’s spam folder?",
        options: [
            { id: "yes_checked", text: "Yes, I checked." },
            { id: "no_checked", text: "No, I haven’t checked yet." },
            { id: "manual_response", text: "Other" },
        ],
    },
    yes_checked: {
        question: "If you’ve checked your spam folder and still can’t find the bill, please contact our billing team. Would you like more assistance?",
        options: [
            { id: "manual_response", text: "Yes, please." },
            { id: "no_help", text: "No, thanks." },
        ],
    },
    no_checked: {
        question: "Please check your spam folder and let us know if the issue persists. Need more help?",
        options: [
            { id: "manual_response", text: "Yes, I need more help." },
            { id: "no_help", text: "No, I’ll try it myself." },
        ],
    },
    wrong_amount: {
        question: "Can you confirm the incorrect amount?",
        options: [
            { id: "undercharged", text: "I was undercharged." },
            { id: "overcharged", text: "I was overcharged." },
            { id: "manual_response", text: "Other" },
        ],
    },
    undercharged: {
        question: "Thanks for reporting. We’ll review the issue and adjust your bill. Need further assistance?",
        options: [
            { id: "manual_response", text: "Yes, please." },
            { id: "no_help", text: "No, that’s all." },
        ],
    },
    overcharged: {
        question: "We’re sorry for the inconvenience. We’ll investigate the overcharge and adjust it. Need more help?",
        options: [
            { id: "manual_response", text: "Yes, I have more questions." },
            { id: "no_help", text: "No, that’s all." },
        ],
    },
    payment_help: {
        question: "What do you need help with regarding payment?",
        options: [
            { id: "payment_methods", text: "Available payment methods" },
            { id: "payment_failed", text: "Payment failed" },
            { id: "manual_response", text: "Other" },
        ],
    },
    payment_methods: {
        question: "Our payment methods include Credit Card, Debit Card, and PayPal. Do you need more assistance?",
        options: [
            { id: "manual_response", text: "Yes, please." },
            { id: "no_help", text: "No, thanks." },
        ],
    },
    payment_failed: {
        question: "What error did you encounter while making the payment?",
        options: [
            { id: "card_declined", text: "Card declined" },
            { id: "transaction_failed", text: "Transaction failed" },
            { id: "manual_response", text: "Other" },
        ],
    },
    tech_support: {
        question: "What technical issue are you facing?",
        options: [
            { id: "login_issues", text: "Unable to log in" },
            { id: "error_messages", text: "Error messages" },
            { id: "performance", text: "Slow performance" },
            { id: "manual_response", text: "Other" },
        ],
    },
    login_issues: {
        question: "Are you unable to reset your password?",
        options: [
            { id: "yes_reset", text: "Yes" },
            { id: "no_reset", text: "No" },
            { id: "manual_response", text: "Other" },
        ],
    },
    error_messages: {
        question: "What type of error message are you seeing?",
        options: [
            { id: "network_error", text: "Network error" },
            { id: "server_error", text: "Server error" },
            { id: "manual_response", text: "Other" },
        ],
    },
    network_error: {
        question: "Please check your internet connection and try again. Need further assistance?",
        options: [
            { id: "manual_response", text: "Yes, please." },
            { id: "no_help", text: "No, thanks." },
        ],
    },
    server_error: {
        question: "It seems there’s an issue on our end. Would you like to report this problem?",
        options: [
            { id: "manual_response", text: "Yes, report it." },
            { id: "no_help", text: "No, thanks." },
        ],
    },
    performance: {
        question: "Is the app slow or unresponsive?",
        options: [
            { id: "slow", text: "Slow" },
            { id: "unresponsive", text: "Unresponsive" },
            { id: "manual_response", text: "Other" },
        ],
    },
    slow: {
        question: "Please try clearing your cache and restarting the app. Need more assistance?",
        options: [
            { id: "manual_response", text: "Yes, I need more help." },
            { id: "no_help", text: "No, thanks." },
        ],
    },
    unresponsive: {
        question: "Are you using the latest version of the app?",
        options: [
            { id: "yes_latest", text: "Yes, I am." },
            { id: "no_latest", text: "No, I’m not." },
            { id: "manual_response", text: "Other" },
        ],
    },
    product: {
        question: "What kind of product inquiry do you have?",
        options: [
            { id: "availability", text: "Product availability" },
            { id: "features", text: "Product features" },
            { id: "pricing", text: "Pricing" },
            { id: "manual_response", text: "Other" },
        ],
    },
    availability: {
        question: "Is there a specific product you’re looking for?",
        options: [
            { id: "specific_product", text: "Yes, a specific product." },
            { id: "general_availability", text: "No, just general availability." },
            { id: "manual_response", text: "Other" },
        ],
    },
    features: {
        question: "What features are you interested in?",
        options: [
            { id: "specific_features", text: "Specific features." },
            { id: "all_features", text: "All features." },
            { id: "manual_response", text: "Other" },
        ],
    },
    pricing: {
        question: "Do you need pricing for a specific product or all products?",
        options: [
            { id: "specific_pricing", text: "Specific product pricing." },
            { id: "general_pricing", text: "General pricing." },
            { id: "manual_response", text: "Other" },
        ],
    },
    manual_response: {
        question: "Please describe your issue in more detail. Our team will get back to you shortly.",
        options: [],
    },
};



// Chatbot Logic
app.post("/chat", (req, res) => {
    const { step, manualQuery } = req.body;

    // Handle manual queries
    if (manualQuery) {
        res.json({
            response: "Thank you for your query. We’ll get back to you within 20 minutes.",
        });
        return;
    }

    // Handle predefined steps
    const currentQuestion = questionTree[step];
    if (currentQuestion) {
        res.json({
            question: currentQuestion.question,
            options: currentQuestion.options,
        });
    } else {
        res.status(400).json({ error: "Invalid step" });
    }
});


// Start Server
app.listen(port, () => {
    console.log(`Chatbot server running at http://localhost:${port}`);
});
