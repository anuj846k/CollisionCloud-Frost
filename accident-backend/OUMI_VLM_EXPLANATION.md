# 🔄 How Oumi is used in the project

## ⚠️ Current Status

**Oumi VLM is fully implemented in the codebase but is currently not in active use.**

**Reason:** The VLM model (Qwen2-VL-2B-Instruct) requires more than 16GB of RAM to run, which exceeds the memory limits of standard development machines. The model loading process causes the system to run out of memory before inference can begin.

**Implementation Status:**

- ✅ Code is complete and functional
- ✅ API endpoints are implemented (`/api/v1/vlm-analysis/analyze-collision`)
- ✅ Integration with collision analysis pipeline is ready
- ❌ Not actively used due to hardware constraints (16GB RAM limit)

**Future Considerations:**

- Could be enabled on systems with 32GB+ RAM
- Could use model quantization to reduce memory footprint
- Could deploy on cloud instances with sufficient resources
- Alternative: Use cloud-based VLM APIs instead of local inference

This documentation describes how Oumi VLM would work if enabled with sufficient hardware resources.

---

## 🔄 The Complete Flow

Here's how Oumi VLM works in our accident reconstruction system:

```
┌─────────────────────────────────────────────────────────────────┐
│                    ACCIDENT VIDEO ANALYSIS                       │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 1: Video Processing (YOLO + ByteTrack)                   │
│  - Detects vehicles in each frame                               │
│  - Tracks vehicles across frames                                │
│  - Identifies collisions                                        │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 2: Extract Key Frames                                    │
│  - Approach frame (vehicles coming together)                   │
│  - Contact frame (moment of impact)                            │
│  - Peak frame (maximum collision)                               │
│  - Separation frame (vehicles moving apart)                     │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 3: Oumi VLM Analysis (NOT CURRENTLY ACTIVE - RAM LIMIT)  │
│  ⚠️ Requires 32GB+ RAM - Currently disabled on 16GB systems     │
│                                                                  │
│  For EACH frame:                                                │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  3.1: Convert frame to base64 image                       │  │
│  │       (image data as text string)                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  3.2: Create "Conversation" with Oumi                    │  │
│  │                                                           │  │
│  │  Conversation = {                                        │  │
│  │    messages: [                                           │  │
│  │      {                                                    │  │
│  │        role: "USER",                                      │  │
│  │        content: [                                        │  │
│  │          { type: "IMAGE_URL", content: "data:image..." },│  │
│  │          { type: "TEXT", content: "Describe this scene" }│  │
│  │        ]                                                  │  │
│  │      }                                                    │  │
│  │    ]                                                      │  │
│  │  }                                                        │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  3.3: Send to Oumi Inference Engine                       │  │
│  │                                                           │  │
│  │  engine.infer(conversation, config)                      │  │
│  │                                                           │  │
│  │  Oumi:                                                   │  │
│  │  - Loads VLM model (Qwen2-VL)                            │  │
│  │  - Processes image + text together                       │  │
│  │  - Generates AI response                                 │  │
│  └──────────────────────────────────────────────────────────┘  │
│                              │                                   │
│                              ▼                                   │
│  ┌──────────────────────────────────────────────────────────┐  │
│  │  3.4: Get AI-generated description                       │  │
│  │                                                           │  │
│  │  Response: "This frame shows two vehicles at an          │  │
│  │            intersection. Vehicle A (red car) is          │  │
│  │            approaching from the left, while Vehicle B    │  │
│  │            (blue truck) is moving straight ahead..."    │  │
│  └──────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────────┐
│  STEP 4: Generate Final Report                                  │
│  - Combines all frame analyses                                 │
│  - Creates comprehensive accident report                       │
└─────────────────────────────────────────────────────────────────┘
```

## 📝 Step-by-Step Code Example

Let's see what happens when you call `analyze_frame()`:

```python
# 1. You have a base64 image (from extracted frame)
image_base64 = "iVBORw0KGgoAAAANSUhEUgAA..."  # Long string of image data

# 2. Create Oumi analyzer
analyzer = OumiVLMAnalyzer(model_name="Qwen/Qwen2-VL-2B-Instruct")

# 3. Analyze the frame
result = analyzer.analyze_frame(
    image_base64=image_base64,
    prompt="Describe the collision scene. What vehicles do you see?"
)

# What happens inside analyze_frame():
```

### Inside `analyze_frame()`:

```python
def analyze_frame(self, image_base64, prompt):
    # STEP 1: Initialize Oumi Engine (only once)
    # This loads the AI model into memory
    self._initialize()
    # → Creates VLLMInferenceEngine with Qwen2-VL model
    # → Model is loaded from cache (your external SSD)

    # STEP 2: Create Conversation Object
    conversation = Conversation(
        messages=[
            Message(
                role=Role.USER,
                content=[
                    ContentItem(
                        content=f"data:image/jpeg;base64,{image_base64}",
                        type=Type.IMAGE_URL
                    ),
                    ContentItem(
                        content=prompt,
                        type=Type.TEXT
                    )
                ]
            )
        ]
    )
    # This is like sending a message to ChatGPT, but with an image!

    # STEP 3: Run Inference (Ask the AI)
    output = self._engine.infer(
        input=[conversation],
        inference_config=self._inference_config
    )
    # Oumi sends the image + prompt to the VLM model
    # The model "sees" the image and "reads" the prompt
    # Then generates a text response

    # STEP 4: Extract Response
    response = output[0].messages[-1].content
    # Returns: "This frame shows two vehicles colliding at an intersection..."

    return response
```

## 🧠 How a VLM (Vision Language Model) is used here?

- **Input:** Image of a car crash + Prompt "Describe this scene"
- **Output:** "Two vehicles are colliding at an intersection. A red sedan is impacting a blue SUV from the side..."

## 🔧 Key Components

### 1. **Oumi Inference Engine**

```python
engine = VLLMInferenceEngine(ModelParams(model_name="Qwen/Qwen2-VL-2B-Instruct"))
```

- This is the "brain" that runs the AI model
- Handles loading the model, processing inputs, generating outputs

### 2. **Conversation Format**

```python
Conversation(
    messages=[Message(role=Role.USER, content=[...])]
)
```

- Standardized way to send image + text to the model
- Like a chat interface, but for images

### 3. **Content Items**

```python
ContentItem(content="data:image/jpeg;base64,...", type=Type.IMAGE_URL)
ContentItem(content="Describe this scene", type=Type.TEXT)
```

- Each piece of content (image or text) is a ContentItem
- Type tells Oumi what kind of content it is

## ⚠️ Hardware Requirements

**Minimum System Requirements for Oumi VLM:**

- **RAM:** 32GB+ (16GB is insufficient - causes out-of-memory errors)
- **GPU:** Optional but recommended for faster inference
- **Storage:** ~10GB for model cache (external SSD supported)

**Current Limitation:**
The implementation was tested on a 16GB RAM system and failed during model loading. The VLM model requires more memory than available, preventing successful initialization.

---

## 🎬 Real Example Flow

**Note:** This flow is documented for reference but is not currently active due to RAM constraints.

When you call the API endpoint:

```bash
POST /api/v1/vlm-analysis/analyze-collision
{
  "project_id": "123",
  "collision_index": 0
}
```

**What happens:**

1. **Backend finds the collision** from video processing results
2. **Extracts 4 key frames** (approach, contact, peak, separation)
3. **For each frame:**
   - Converts frame to base64 image
   - Calls `analyzer.analyze_frame(image_base64, custom_prompt)`
   - Gets AI description
4. **Combines all 4 analyses** into a final report

**Result:**

```json
{
  "frame_analyses": {
    "approach": {
      "frame_number": 210,
      "analysis": "Two vehicles are approaching an intersection..."
    },
    "contact": {
      "frame_number": 260,
      "analysis": "The red sedan makes initial contact with the blue SUV..."
    },
    "peak": {
      "frame_number": 341,
      "analysis": "Maximum collision impact occurs with significant overlap..."
    },
    "separation": {
      "frame_number": 601,
      "analysis": "Vehicles begin to separate after the collision..."
    }
  },
  "summary": "# ACCIDENT ANALYSIS REPORT\n\n## Collision Details..."
}
```
