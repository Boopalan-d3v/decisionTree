import { S3Client, GetObjectCommand, PutObjectCommand, ListObjectsV2Command } from "@aws-sdk/client-s3";

export const BUCKET_NAME = process.env.REACT_APP_S3_BUCKET_NAME;
export const REGION = process.env.REACT_APP_AWS_REGION;
export const FILE_KEY = process.env.REACT_APP_S3_FILE_KEY; // Path of the file in the bucket

if (!BUCKET_NAME || !REGION || !FILE_KEY) {
  console.error("❌ Missing required AWS environment variables!");
}

export const s3Client = new S3Client({
  region: REGION,
  credentials: {
    accessKeyId: process.env.REACT_APP_AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.REACT_APP_AWS_SECRET_ACCESS_KEY,
  },
});

export const S3_URL = `https://${BUCKET_NAME}.s3.${REGION}.amazonaws.com/${FILE_KEY}`;

// Fetch Data from S3
export const fetchDataFromS3 = async () => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: FILE_KEY,
    };

    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);

    const body = await response.Body.transformToString();
    return JSON.parse(body);
  } catch (error) {
    console.error("Error fetching data from S3:", error);
    return [];
  }
};

// Upload Data to S3
export const uploadDataToS3 = async ({ key, data, update = false }) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: update ? 'flowchart.json' : `flowcharts/${key}`,
      Body: JSON.stringify(data, null, 2),
      ContentType: 'application/json'
    };

    const command = new PutObjectCommand(params);
    await s3Client.send(command);
  } catch (error) {
    console.error('Error uploading to S3:', error);
    throw error;
  }
};

export const listFlowcharts = async () => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Prefix: 'flowcharts/'
    };

    const command = new ListObjectsV2Command(params);
    const data = await s3Client.send(command);
    return data.Contents?.map(item => ({
      filename: item.Key.replace('flowcharts/', ''),
      lastModified: item.LastModified
    })) || [];
  } catch (error) {
    throw new Error(`Failed to list flowcharts: ${error.message}`);
  }
};

export const getFlowchartData = async (filename) => {
  try {
    const params = {
      Bucket: BUCKET_NAME,
      Key: `flowcharts/${filename}`
    };

    const command = new GetObjectCommand(params);
    const response = await s3Client.send(command);
    
    // Convert the response stream to JSON
    const data = await response.Body.transformToString();
    return JSON.parse(data);
  } catch (error) {
    throw new Error(`Failed to fetch flowchart: ${error.message}`);
  }
};
