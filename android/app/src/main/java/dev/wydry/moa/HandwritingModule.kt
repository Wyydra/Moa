package dev.wydry.moa

import com.facebook.react.bridge.ReactApplicationContext
import com.facebook.react.bridge.ReactContextBaseJavaModule
import com.facebook.react.bridge.ReactMethod
import com.facebook.react.bridge.Promise
import com.facebook.react.bridge.ReadableArray
import com.facebook.react.bridge.WritableNativeArray
import com.google.mlkit.vision.digitalink.DigitalInkRecognizer
import com.google.mlkit.vision.digitalink.DigitalInkRecognitionModel
import com.google.mlkit.vision.digitalink.DigitalInkRecognitionModelIdentifier
import com.google.mlkit.vision.digitalink.DigitalInkRecognizerOptions
import com.google.mlkit.vision.digitalink.Ink
import com.google.mlkit.common.model.DownloadConditions
import com.google.mlkit.common.model.RemoteModelManager
import android.util.Log

class HandwritingModule(reactContext: ReactApplicationContext) : ReactContextBaseJavaModule(reactContext) {
    
    private var recognizer: DigitalInkRecognizer? = null
    private val modelManager = RemoteModelManager.getInstance()
    private val TAG = "HandwritingModule"
    
    override fun getName(): String {
        return "HandwritingModule"
    }
    
    @ReactMethod
    fun isModelDownloaded(languageCode: String, promise: Promise) {
        try {
            val modelIdentifier = DigitalInkRecognitionModelIdentifier.fromLanguageTag(languageCode)
            
            if (modelIdentifier == null) {
                promise.reject("INVALID_LANGUAGE", "Invalid language code: $languageCode")
                return
            }
            
            val model = DigitalInkRecognitionModel.builder(modelIdentifier).build()
            
            modelManager.isModelDownloaded(model)
                .addOnSuccessListener { isDownloaded ->
                    Log.d(TAG, "Model $languageCode downloaded: $isDownloaded")
                    promise.resolve(isDownloaded)
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Error checking model download status", e)
                    promise.reject("CHECK_ERROR", "Failed to check model status: ${e.message}", e)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error in isModelDownloaded", e)
            promise.reject("ERROR", "Error checking model: ${e.message}", e)
        }
    }
    
    @ReactMethod
    fun downloadModel(languageCode: String, promise: Promise) {
        try {
            val modelIdentifier = DigitalInkRecognitionModelIdentifier.fromLanguageTag(languageCode)
            
            if (modelIdentifier == null) {
                promise.reject("INVALID_LANGUAGE", "Invalid language code: $languageCode")
                return
            }
            
            val model = DigitalInkRecognitionModel.builder(modelIdentifier).build()
            
            val conditions = DownloadConditions.Builder().build()
            
            modelManager.download(model, conditions)
                .addOnSuccessListener {
                    Log.d(TAG, "Model $languageCode downloaded successfully")
                    promise.resolve(true)
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Error downloading model", e)
                    promise.reject("DOWNLOAD_ERROR", "Failed to download model: ${e.message}", e)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error in downloadModel", e)
            promise.reject("ERROR", "Error downloading model: ${e.message}", e)
        }
    }
    
    @ReactMethod
    fun initializeRecognizer(languageCode: String, promise: Promise) {
        try {
            val modelIdentifier = DigitalInkRecognitionModelIdentifier.fromLanguageTag(languageCode)
            
            if (modelIdentifier == null) {
                promise.reject("INVALID_LANGUAGE", "Invalid language code: $languageCode")
                return
            }
            
            val model = DigitalInkRecognitionModel.builder(modelIdentifier).build()
            
            recognizer?.close()
            
            recognizer = com.google.mlkit.vision.digitalink.DigitalInkRecognition.getClient(
                DigitalInkRecognizerOptions.builder(model).build()
            )
            
            Log.d(TAG, "Recognizer initialized for language: $languageCode")
            promise.resolve(true)
        } catch (e: Exception) {
            Log.e(TAG, "Error initializing recognizer", e)
            promise.reject("INIT_ERROR", "Failed to initialize recognizer: ${e.message}", e)
        }
    }
    
    @ReactMethod
    fun recognize(strokes: ReadableArray, promise: Promise) {
        try {
            if (recognizer == null) {
                promise.reject("NOT_INITIALIZED", "Recognizer not initialized. Call initializeRecognizer first.")
                return
            }
            
            if (strokes.size() == 0) {
                promise.resolve(WritableNativeArray())
                return
            }
            
            val inkBuilder = Ink.builder()
            
            for (i in 0 until strokes.size()) {
                val stroke = strokes.getMap(i)
                val points = stroke?.getArray("points")
                
                if (points != null && points.size() > 0) {
                    val strokeBuilder = Ink.Stroke.builder()
                    
                    for (j in 0 until points.size()) {
                        val point = points.getMap(j)
                        if (point != null) {
                            val x = point.getDouble("x").toFloat()
                            val y = point.getDouble("y").toFloat()
                            val t = point.getDouble("t").toLong()
                            
                            strokeBuilder.addPoint(Ink.Point.create(x, y, t))
                        }
                    }
                    
                    inkBuilder.addStroke(strokeBuilder.build())
                }
            }
            
            val ink = inkBuilder.build()
            
            recognizer!!.recognize(ink)
                .addOnSuccessListener { result ->
                    val candidates = result.candidates
                    val resultArray = WritableNativeArray()
                    
                    for (candidate in candidates) {
                        resultArray.pushString(candidate.text)
                    }
                    
                    Log.d(TAG, "Recognition successful. Results: ${candidates.size}")
                    promise.resolve(resultArray)
                }
                .addOnFailureListener { e ->
                    Log.e(TAG, "Recognition error", e)
                    promise.reject("RECOGNITION_ERROR", "Failed to recognize: ${e.message}", e)
                }
        } catch (e: Exception) {
            Log.e(TAG, "Error in recognize", e)
            promise.reject("ERROR", "Error during recognition: ${e.message}", e)
        }
    }
    
    override fun onCatalystInstanceDestroy() {
        super.onCatalystInstanceDestroy()
        recognizer?.close()
        recognizer = null
    }
}
