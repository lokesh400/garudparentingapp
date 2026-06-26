import React, { useState, useEffect, useRef, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  Pressable,
  ActivityIndicator,
  Image,
  Alert,
  Modal,
  Platform,
  Animated,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as ImagePicker from "expo-image-picker";
import * as DocumentPicker from "expo-document-picker";
import * as WebBrowser from "expo-web-browser";
import SafeScreen from "../components/SafeScreen";
import { API } from "../utils/api";

const DOCUMENT_TYPES = [
  { key: "class10Marksheet", label: "Class 10 Marksheet", icon: "document-text" },
  { key: "class12Marksheet", label: "Class 12 Marksheet", icon: "document-text" },
  { key: "aadharCard", label: "Aadhaar Card", icon: "card" },
  { key: "fatherAadharCard", label: "Father Aadhaar Card", icon: "card" },
  { key: "motherAadharCard", label: "Mother Aadhaar Card", icon: "card" },
];

export default function DocumentCenter() {
  const [studentId, setStudentId] = useState(null);
  const [studentName, setStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [documents, setDocuments] = useState({});
  const [studentPhoto, setStudentPhoto] = useState(null);
  const [allowPhotoReupload, setAllowPhotoReupload] = useState(false);
  const [allowDocumentReupload, setAllowDocumentReupload] = useState(false);
  
  // Custom Action Sheet Modal
  const [pickerModalVisible, setPickerModalVisible] = useState(false);
  const [activeDocName, setActiveDocName] = useState(null); // Which document key is being uploaded

  // Image Preview Modal State
  const [previewVisible, setPreviewVisible] = useState(false);
  const [previewUrl, setPreviewUrl] = useState("");
  const [previewTitle, setPreviewTitle] = useState("");
  const [previewLoading, setPreviewLoading] = useState(false);
  
  // Custom Toast Notification State
  const [toast, setToast] = useState({ visible: false, message: "" });
  const toastOpacity = useRef(new Animated.Value(0)).current;
  const toastTranslateY = useRef(new Animated.Value(-50)).current;

  const router = useRouter();

  // Load user info and document statuses
  const fetchData = useCallback(async () => {
    try {
      const userId = await AsyncStorage.getItem("userId");
      if (!userId) {
        Alert.alert("Error", "Session expired, please login again.");
        router.replace("/login");
        return;
      }
      setStudentId(userId);

      // Fetch student basic profile details to show student name
      try {
        const studentRes = await API.post(`/me/${userId}`);
        if (studentRes.data?.name) {
          setStudentName(studentRes.data.name);
        }
      } catch (err) {
        console.log("Error fetching student profile:", err);
      }

      // Fetch documents details
      const docRes = await API.get(`/api/mobile/documents/${userId}`);
      if (docRes.data?.success) {
        setDocuments(docRes.data.documents || {});
        setStudentPhoto(docRes.data.studentPhoto || null);
        setAllowPhotoReupload(docRes.data.allowPhotoReupload || false);
        setAllowDocumentReupload(docRes.data.allowDocumentReupload || false);
      } else {
        console.log("Failed to fetch documents status:", docRes.data?.message);
      }
    } catch (error) {
      console.log("Error in DocumentCenter data fetch:", error);
      Alert.alert("Error", "Could not fetch document status. Please try again.");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Show premium custom toast
  const triggerToast = (message) => {
    setToast({ visible: true, message });
    toastOpacity.setValue(0);
    toastTranslateY.setValue(-50);

    Animated.parallel([
      Animated.timing(toastOpacity, {
        toValue: 1,
        duration: 350,
        useNativeDriver: true,
      }),
      Animated.timing(toastTranslateY, {
        toValue: 0,
        duration: 350,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setTimeout(() => {
        Animated.parallel([
          Animated.timing(toastOpacity, {
            toValue: 0,
            duration: 300,
            useNativeDriver: true,
          }),
          Animated.timing(toastTranslateY, {
            toValue: -50,
            duration: 300,
            useNativeDriver: true,
          }),
        ]).start(() => {
          setToast({ visible: false, message: "" });
        });
      }, 3000);
    });
  };

  // Upload handler calling POST /api/mobile/documents/upload
  const handleUpload = async (pickerResult, documentName) => {
    if (pickerResult.canceled || !pickerResult.assets || pickerResult.assets.length === 0) {
      return;
    }

    setUploading(true);
    const asset = pickerResult.assets[0];
    const fileUri = asset.uri;
    const fileName = asset.name || fileUri.split("/").pop() || "file";
    const fileType = asset.mimeType || "application/octet-stream";

    try {
      const formData = new FormData();
      formData.append("studentId", studentId);
      formData.append("name", documentName);
      formData.append("file", {
        uri: Platform.OS === "ios" ? fileUri.replace("file://", "") : fileUri,
        name: fileName,
        type: fileType,
      });

      const res = await API.post("/api/mobile/documents/upload", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (res.data?.success) {
        // Refresh statuses
        setDocuments(res.data.documents || {});
        if (res.data.studentPhoto) {
          setStudentPhoto(res.data.studentPhoto);
        }
        setAllowPhotoReupload(res.data.allowPhotoReupload || false);
        setAllowDocumentReupload(res.data.allowDocumentReupload || false);
        
        const friendlyName = documentName === "studentPhoto" 
          ? "Profile photo" 
          : DOCUMENT_TYPES.find(d => d.key === documentName)?.label || "Document";

        triggerToast(`${friendlyName} uploaded successfully!`);
      } else {
        Alert.alert("Upload Failed", res.data?.message || "Something went wrong.");
      }
    } catch (error) {
      console.log("Upload error details:", error?.response?.data || error);
      Alert.alert("Upload Error", "Failed to upload document. Please try again.");
    } finally {
      setUploading(false);
    }
  };

  // Trigger camera capture
  const takePhoto = async (documentName) => {
    setPickerModalVisible(false);
    const { status } = await ImagePicker.requestCameraPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Camera permissions are required to snap a document photo.");
      return;
    }

    try {
      const result = await ImagePicker.launchCameraAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      await handleUpload(result, documentName);
    } catch (err) {
      console.log("Camera error:", err);
      Alert.alert("Error", "Could not open camera.");
    }
  };

  // Trigger gallery picker
  const pickFromGallery = async (documentName) => {
    setPickerModalVisible(false);
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Permission Denied", "Gallery permissions are required to select a document image.");
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.Images,
        allowsEditing: true,
        quality: 0.8,
      });
      await handleUpload(result, documentName);
    } catch (err) {
      console.log("Gallery error:", err);
      Alert.alert("Error", "Could not open gallery.");
    }
  };

  // Trigger document picker (PDFs or general files)
  const pickDocument = async (documentName) => {
    setPickerModalVisible(false);
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: ["image/*", "application/pdf"],
      });
      await handleUpload(result, documentName);
    } catch (err) {
      console.log("DocumentPicker error:", err);
      Alert.alert("Error", "Could not open document selector.");
    }
  };

  // Open picker modal options
  const openPickerOptions = (documentName) => {
    setActiveDocName(documentName);
    setPickerModalVisible(true);
  };

  // Preview document URL using in-app browser or in-app image modal
  const handlePreview = async (url, label) => {
    if (!url) return;
    
    let targetUrl = "";
    if (url && typeof url === "object") {
      targetUrl = url.url || "";
    } else if (typeof url === "string") {
      targetUrl = url;
    }

    if (!targetUrl) {
      Alert.alert("Error", "Invalid document link.");
      return;
    }

    const isPdf = targetUrl.toLowerCase().endsWith(".pdf") || targetUrl.toLowerCase().includes(".pdf?");

    if (isPdf) {
      try {
        await WebBrowser.openBrowserAsync(targetUrl, {
          dismissButtonStyle: "close",
          readerMode: false,
          enableBarCollapsing: true,
        });
      } catch (err) {
        console.log("Preview error:", err);
        Alert.alert("Error", "Unable to open PDF document.");
      }
    } else {
      setPreviewTitle(label || "Document Preview");
      setPreviewUrl(targetUrl);
      setPreviewLoading(true);
      setPreviewVisible(true);
    }
  };

  if (loading) {
    return (
      <SafeScreen style={styles.center}>
        <ActivityIndicator size="large" color="#6366f1" />
        <Text style={styles.loadingText}>Fetching documents status...</Text>
      </SafeScreen>
    );
  }

  return (
    <SafeScreen style={styles.screen} edges={["top", "bottom"]}>
      {/* Back Header */}
      <View style={styles.header}>
        <Pressable
          onPress={() => router.back()}
          style={({ pressed }) => [styles.backButton, pressed && styles.backButtonPressed]}
        >
          <Ionicons name="arrow-back" size={24} color="#1f2937" />
        </Pressable>
        <View style={styles.headerTitleWrap}>
          <Text style={styles.headerTitle}>Document Center</Text>
          {studentName ? (
            <Text style={styles.headerSubtitle}>{studentName}</Text>
          ) : null}
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView contentContainerStyle={styles.container} showsVerticalScrollIndicator={false}>
        {/* Profile Photo Section */}
        <View style={styles.photoSection}>
          <Text style={styles.sectionHeading}>Student Profile Photo</Text>
          <Text style={styles.sectionSub}>Update the student{"'"}s profile photo for school records</Text>
          
          <View style={styles.avatarContainer}>
            <Pressable 
              onPress={() => {
                if (studentPhoto && !allowPhotoReupload) {
                  Alert.alert("Locked", "Profile photo re-upload is locked. Please contact admin to enable re-upload.");
                  return;
                }
                openPickerOptions("studentPhoto");
              }}
              style={({ pressed }) => [styles.avatarPressable, pressed && (studentPhoto && !allowPhotoReupload ? {} : styles.avatarPressed)]}
            >
              <View style={styles.avatarWrapper}>
                {studentPhoto ? (
                  <Image source={{ uri: studentPhoto }} style={styles.avatarImage} />
                ) : (
                  <View style={styles.avatarPlaceholder}>
                    <Ionicons name="person" size={54} color="#a5b4fc" />
                  </View>
                )}
                {(!studentPhoto || allowPhotoReupload) && (
                  <View style={styles.cameraBadge}>
                    <Ionicons name="camera" size={16} color="#fff" />
                  </View>
                )}
              </View>
            </Pressable>
            <View style={{ flexDirection: "row", gap: 10, marginTop: 12 }}>
              {studentPhoto && (
                <Pressable
                  onPress={() => handlePreview(studentPhoto, "Profile Photo")}
                  style={({ pressed }) => [styles.viewPhotoBtn, pressed && styles.btnPressed, { marginTop: 0 }]}
                >
                  <Ionicons name="eye" size={14} color="#6366f1" />
                  <Text style={styles.viewPhotoText}>View Large</Text>
                </Pressable>
              )}
              {studentPhoto && allowPhotoReupload && (
                <Pressable
                  onPress={() => openPickerOptions("studentPhoto")}
                  style={({ pressed }) => [styles.replacePhotoBtn, pressed && styles.btnPressed]}
                >
                  <Ionicons name="cloud-upload-outline" size={14} color="#475569" />
                  <Text style={styles.replacePhotoText}>Replace</Text>
                </Pressable>
              )}
            </View>
          </View>
        </View>

        {/* Required Documents Section */}
        <View style={styles.documentsSection}>
          <Text style={styles.sectionHeading}>Required Documents</Text>
          <Text style={styles.sectionSub}>Please upload clear, legible copies of the documents below</Text>

          {DOCUMENT_TYPES.map((doc) => {
            const documentUrl = documents[doc.key];
            const isUploaded = !!documentUrl;

            return (
              <View key={doc.key} style={[styles.docCard, isUploaded && styles.docCardUploaded]}>
                <View style={styles.docInfoRow}>
                  <View style={[styles.docIconBg, isUploaded && styles.docIconBgUploaded]}>
                    <Ionicons 
                      name={doc.icon} 
                      size={22} 
                      color={isUploaded ? "#10b981" : "#6366f1"} 
                    />
                  </View>
                  
                  <View style={styles.docMeta}>
                    <Text style={styles.docLabel}>{doc.label}</Text>
                    {isUploaded ? (
                      <View style={styles.uploadedBadge}>
                        <Ionicons name="checkmark-circle" size={12} color="#10b981" />
                        <Text style={styles.uploadedBadgeText}>Uploaded</Text>
                      </View>
                    ) : (
                      <View style={styles.missingBadge}>
                        <Ionicons name="alert-circle" size={12} color="#f59e0b" />
                        <Text style={styles.missingBadgeText}>Required</Text>
                      </View>
                    )}
                  </View>
                </View>

                {/* Actions Row */}
                <View style={styles.cardActionsRow}>
                  {isUploaded ? (
                    <>
                      <Pressable
                        onPress={() => handlePreview(documentUrl, doc.label)}
                        style={({ pressed }) => [styles.actionButtonOutline, pressed && styles.btnPressed]}
                      >
                        <Ionicons name="eye-outline" size={16} color="#6366f1" />
                        <Text style={styles.actionBtnOutlineText}>Preview</Text>
                      </Pressable>
                      {allowDocumentReupload && (
                        <Pressable
                           onPress={() => openPickerOptions(doc.key)}
                           style={({ pressed }) => [styles.actionButtonOutline, pressed && styles.btnPressed]}
                        >
                          <Ionicons name="cloud-upload-outline" size={16} color="#475569" />
                          <Text style={styles.actionBtnOutlineTextSecondary}>Replace</Text>
                        </Pressable>
                      )}
                    </>
                  ) : (
                    <Pressable
                      onPress={() => openPickerOptions(doc.key)}
                      style={({ pressed }) => [styles.actionButtonPrimary, pressed && styles.btnPressed]}
                    >
                      <Ionicons name="cloud-upload" size={16} color="#fff" />
                      <Text style={styles.actionBtnPrimaryText}>Upload Document</Text>
                    </Pressable>
                  )}
                </View>
              </View>
            );
          })}
        </View>
      </ScrollView>

      {/* Floating Animated Toast Banner */}
      {toast.visible && (
        <Animated.View
          style={[
            styles.toastWrapper,
            {
              opacity: toastOpacity,
              transform: [{ translateY: toastTranslateY }],
            },
          ]}
        >
          <View style={styles.toastContainer}>
            <Ionicons name="checkmark-circle" size={20} color="#fff" style={{ marginRight: 8 }} />
            <Text style={styles.toastText} numberOfLines={2}>
              {toast.message}
            </Text>
          </View>
        </Animated.View>
      )}

      {/* Full screen loader for uploading */}
      {uploading && (
        <View style={styles.loaderOverlay}>
          <View style={styles.loaderCard}>
            <ActivityIndicator size="large" color="#6366f1" />
            <Text style={styles.loaderText}>Uploading document...</Text>
            <Text style={styles.loaderSubtext}>Please do not close the app</Text>
          </View>
        </View>
      )}

      {/* Custom Picker Modal Sheet */}
      <Modal
        animationType="slide"
        transparent={true}
        visible={pickerModalVisible}
        onRequestClose={() => setPickerModalVisible(false)}
      >
        <View style={styles.modalBackdrop}>
          <Pressable style={styles.dismissBackdrop} onPress={() => setPickerModalVisible(false)} />
          <View style={styles.modalSheet}>
            <View style={styles.sheetHeader}>
              <View style={styles.sheetBar} />
              <Text style={styles.sheetTitle}>Upload Source</Text>
              <Text style={styles.sheetSubtitle}>Choose how you want to select the document</Text>
            </View>

            <View style={styles.sheetButtons}>
              <Pressable
                onPress={() => takePhoto(activeDocName)}
                style={({ pressed }) => [styles.sheetButton, pressed && styles.sheetButtonPressed]}
              >
                <View style={[styles.sheetIconBg, { backgroundColor: "#e0f2fe" }]}>
                  <Ionicons name="camera" size={22} color="#0284c7" />
                </View>
                <Text style={styles.sheetButtonText}>Take Photo with Camera</Text>
              </Pressable>

              <Pressable
                onPress={() => pickFromGallery(activeDocName)}
                style={({ pressed }) => [styles.sheetButton, pressed && styles.sheetButtonPressed]}
              >
                <View style={[styles.sheetIconBg, { backgroundColor: "#eef2ff" }]}>
                  <Ionicons name="image" size={22} color="#6366f1" />
                </View>
                <Text style={styles.sheetButtonText}>Choose from Gallery</Text>
              </Pressable>

              <Pressable
                onPress={() => pickDocument(activeDocName)}
                style={({ pressed }) => [styles.sheetButton, pressed && styles.sheetButtonPressed]}
              >
                <View style={[styles.sheetIconBg, { backgroundColor: "#f0fdf4" }]}>
                  <Ionicons name="document" size={22} color="#16a34a" />
                </View>
                <Text style={styles.sheetButtonText}>Select PDF / Files</Text>
              </Pressable>

              <Pressable
                onPress={() => setPickerModalVisible(false)}
                style={({ pressed }) => [styles.sheetCancelButton, pressed && styles.sheetButtonPressed]}
              >
                <Text style={styles.sheetCancelButtonText}>Cancel</Text>
              </Pressable>
            </View>
          </View>
        </View>
      </Modal>

      {/* Premium Full-Screen Image Preview Modal */}
      <Modal
        animationType="fade"
        transparent={true}
        visible={previewVisible}
        onRequestClose={() => setPreviewVisible(false)}
      >
        <View style={styles.previewBackdrop}>
          <Pressable style={StyleSheet.absoluteFillObject} onPress={() => setPreviewVisible(false)} />
          
          <View style={styles.previewContainer}>
            {/* Header */}
            <View style={styles.previewHeader}>
              <Text style={styles.previewTitle} numberOfLines={1}>
                {previewTitle}
              </Text>
              <Pressable
                onPress={() => setPreviewVisible(false)}
                style={({ pressed }) => [styles.previewCloseBtn, pressed && styles.btnPressed]}
              >
                <Ionicons name="close" size={24} color="#ffffff" />
              </Pressable>
            </View>

            {/* Image View Area */}
            <View style={styles.previewContent}>
              {previewUrl ? (
                <Image
                  source={{ uri: previewUrl }}
                  style={styles.previewImage}
                  resizeMode="contain"
                  onLoadStart={() => setPreviewLoading(true)}
                  onLoadEnd={() => setPreviewLoading(false)}
                />
              ) : null}

              {previewLoading && (
                <View style={styles.previewLoaderOverlay}>
                  <ActivityIndicator size="large" color="#ffffff" />
                </View>
              )}
            </View>
          </View>
        </View>
      </Modal>
    </SafeScreen>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f8fafc",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
  },
  loadingText: {
    marginTop: 14,
    color: "#64748b",
    fontWeight: "600",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: "#ffffff",
    borderBottomWidth: 1,
    borderBottomColor: "#e2e8f0",
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 10,
    backgroundColor: "#f1f5f9",
    alignItems: "center",
    justifyContent: "center",
  },
  backButtonPressed: {
    opacity: 0.7,
  },
  headerTitleWrap: {
    flex: 1,
    alignItems: "center",
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f2937",
  },
  headerSubtitle: {
    fontSize: 11,
    color: "#6366f1",
    fontWeight: "700",
    marginTop: 2,
  },
  container: {
    padding: 16,
    paddingBottom: 40,
  },
  photoSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 20,
    alignItems: "center",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: "800",
    color: "#1f2937",
    marginBottom: 4,
    alignSelf: "flex-start",
  },
  sectionSub: {
    fontSize: 12,
    color: "#64748b",
    fontWeight: "500",
    marginBottom: 16,
    alignSelf: "flex-start",
  },
  avatarContainer: {
    alignItems: "center",
    marginVertical: 8,
  },
  avatarPressable: {
    borderRadius: 60,
  },
  avatarPressed: {
    opacity: 0.85,
  },
  avatarWrapper: {
    width: 110,
    height: 110,
    borderRadius: 55,
    borderWidth: 3,
    borderColor: "#e0e7ff",
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f5f7ff",
    position: "relative",
  },
  avatarImage: {
    width: "100%",
    height: "100%",
    borderRadius: 55,
  },
  avatarPlaceholder: {
    justifyContent: "center",
    alignItems: "center",
  },
  cameraBadge: {
    position: "absolute",
    bottom: 2,
    right: 2,
    backgroundColor: "#6366f1",
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2.5,
    borderColor: "#ffffff",
  },
  viewPhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 12,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  viewPhotoText: {
    fontSize: 12,
    color: "#6366f1",
    fontWeight: "700",
    marginLeft: 6,
  },
  replacePhotoBtn: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 8,
    backgroundColor: "#f1f5f9",
    borderWidth: 1,
    borderColor: "#cbd5e1",
  },
  replacePhotoText: {
    fontSize: 12,
    color: "#475569",
    fontWeight: "700",
    marginLeft: 6,
  },
  documentsSection: {
    backgroundColor: "#ffffff",
    borderRadius: 16,
    padding: 16,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    elevation: 2,
    shadowColor: "#000",
    shadowOpacity: 0.04,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
  },
  docCard: {
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e2e8f0",
    marginBottom: 12,
  },
  docCardUploaded: {
    backgroundColor: "#ffffff",
    borderColor: "#d1fae5",
    borderWidth: 1.5,
  },
  docInfoRow: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },
  docIconBg: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: "#eef2ff",
    justifyContent: "center",
    alignItems: "center",
  },
  docIconBgUploaded: {
    backgroundColor: "#ecfdf5",
  },
  docMeta: {
    marginLeft: 12,
    flex: 1,
  },
  docLabel: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
    marginBottom: 4,
  },
  uploadedBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#d1fae5",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  uploadedBadgeText: {
    fontSize: 10,
    color: "#065f46",
    fontWeight: "700",
    marginLeft: 4,
  },
  missingBadge: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#fef3c7",
    alignSelf: "flex-start",
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  missingBadgeText: {
    fontSize: 10,
    color: "#92400e",
    fontWeight: "700",
    marginLeft: 4,
  },
  cardActionsRow: {
    flexDirection: "row",
    gap: 10,
  },
  actionButtonOutline: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 9,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: "#cbd5e1",
    backgroundColor: "#ffffff",
  },
  actionBtnOutlineText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#6366f1",
    marginLeft: 6,
  },
  actionBtnOutlineTextSecondary: {
    fontSize: 12,
    fontWeight: "700",
    color: "#475569",
    marginLeft: 6,
  },
  actionButtonPrimary: {
    flex: 1,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 10,
    borderRadius: 8,
    backgroundColor: "#6366f1",
    elevation: 1,
    shadowColor: "#6366f1",
    shadowOpacity: 0.15,
    shadowRadius: 4,
    shadowOffset: { width: 0, height: 2 },
  },
  actionBtnPrimaryText: {
    fontSize: 12,
    fontWeight: "700",
    color: "#ffffff",
    marginLeft: 6,
  },
  btnPressed: {
    opacity: 0.8,
  },
  loaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "center",
    alignItems: "center",
    zIndex: 1000,
  },
  loaderCard: {
    backgroundColor: "#ffffff",
    padding: 24,
    borderRadius: 16,
    alignItems: "center",
    minWidth: 220,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  loaderText: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: "700",
    color: "#1f2937",
  },
  loaderSubtext: {
    marginTop: 6,
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
  },
  toastWrapper: {
    position: "absolute",
    top: 40,
    left: 16,
    right: 16,
    zIndex: 9999,
  },
  toastContainer: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#10b981",
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
    shadowColor: "#10b981",
    shadowOpacity: 0.2,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 5,
  },
  toastText: {
    color: "#ffffff",
    fontWeight: "700",
    fontSize: 13,
    flex: 1,
  },
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(15, 23, 42, 0.45)",
    justifyContent: "flex-end",
  },
  dismissBackdrop: {
    ...StyleSheet.absoluteFillObject,
  },
  modalSheet: {
    backgroundColor: "#ffffff",
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    padding: 20,
    paddingBottom: Platform.OS === "ios" ? 36 : 24,
  },
  sheetHeader: {
    alignItems: "center",
    marginBottom: 18,
  },
  sheetBar: {
    width: 40,
    height: 4,
    backgroundColor: "#e2e8f0",
    borderRadius: 2,
    marginBottom: 12,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: "#1f2937",
  },
  sheetSubtitle: {
    fontSize: 11,
    color: "#64748b",
    fontWeight: "500",
    marginTop: 2,
  },
  sheetButtons: {
    gap: 12,
  },
  sheetButton: {
    flexDirection: "row",
    alignItems: "center",
    padding: 12,
    backgroundColor: "#f8fafc",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e2e8f0",
  },
  sheetButtonPressed: {
    backgroundColor: "#f1f5f9",
    opacity: 0.9,
  },
  sheetIconBg: {
    width: 38,
    height: 38,
    borderRadius: 8,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  sheetButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#334155",
  },
  sheetCancelButton: {
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 14,
    borderRadius: 12,
    backgroundColor: "#f1f5f9",
    marginTop: 4,
  },
  sheetCancelButtonText: {
    fontSize: 14,
    fontWeight: "700",
    color: "#475569",
  },
  previewBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0, 0, 0, 0.95)",
    justifyContent: "center",
    alignItems: "center",
  },
  previewContainer: {
    width: "100%",
    height: "100%",
    justifyContent: "space-between",
  },
  previewHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 20,
    paddingTop: Platform.OS === "ios" ? 60 : 30,
    paddingBottom: 15,
    backgroundColor: "rgba(0, 0, 0, 0.4)",
  },
  previewTitle: {
    color: "#ffffff",
    fontSize: 18,
    fontWeight: "800",
    flex: 1,
    marginRight: 15,
  },
  previewCloseBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: "rgba(255, 255, 255, 0.15)",
    alignItems: "center",
    justifyContent: "center",
  },
  previewContent: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    position: "relative",
  },
  previewImage: {
    width: "100%",
    height: "100%",
  },
  previewLoaderOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(0, 0, 0, 0.3)",
    justifyContent: "center",
    alignItems: "center",
  },
});
