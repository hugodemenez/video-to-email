import {
  Button,
  Container,
  Heading,
  Img,
  Link,
  Section,
  Text,
  Tailwind,
} from "@react-email/components";
import * as React from "react";

interface EmailTemplateProps {
  videoTitle?: string;
  videoThumbnail?: string;
  videoUrl?: string;
  previewText?: string;
  keyPoints?: string[];
  description?: string;
  companyName?: string;
}

export const EmailTemplate = ({
  videoTitle = "Product Update",
  videoThumbnail = "/painting.jpg",
  videoUrl = "#",
  previewText = "Check out our latest product update!",
  keyPoints = [
    "New feature announcement",
    "Improved user experience",
    "Performance enhancements",
  ],
  description = "We're excited to share our latest product update with you. Watch the video to learn about the new features and improvements we've made.",
  companyName = "Your Company",
}: EmailTemplateProps) => {
  // Use div instead of Html/Body/Head for React DOM rendering
  // These components from @react-email/components render actual <html>/<body>/<head> tags
  // which are invalid when nested inside React DOM
  // Tailwind component inlines styles for email client compatibility
  return (
    <div style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif' }}>
      <Tailwind>
        <div className="w-full m-0 p-0 bg-[#f7f7f4]">
          <Container className="mx-auto my-0 py-0 px-2 max-w-[600px] rounded-none w-full">
          <Section className="py-10 px-8 bg-black text-center w-full">
            <Heading className="text-white text-[28px] font-semibold m-0 text-center tracking-[-0.02em]" style={{ fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif', lineHeight: "1.2" }}>
              {companyName}
            </Heading>
          </Section>
          
          <Section className="py-10 px-8 w-full">
            <Heading className="text-black text-2xl font-semibold mt-0 mb-5 mx-0 tracking-[-0.01em] leading-[1.3]">
              {videoTitle}
            </Heading>
            
            {description && (
              <Text className="text-[#333333] text-base leading-[1.6] mt-0 mb-6 mx-0">
                {description}
              </Text>
            )}
            
            <Img
              src={videoThumbnail}
              width="600"
              height="300"
              alt={videoTitle}
              className="w-full max-w-full h-auto rounded-none mt-0 mb-8 mx-0 block"
            />
            
            {keyPoints && keyPoints.length > 0 && (
              <>
                <Heading as="h3" className="text-black text-lg font-semibold mt-8 mb-4 mx-0 tracking-[-0.01em] leading-[1.3]">
                  Key Points
                </Heading>
                <Section className="my-0 mx-0 py-0 px-0">
                  {keyPoints.map((point, index) => (
                    <Text key={index} className="text-[#333333] text-base leading-[1.6] mt-0 mb-3 mx-0 py-0 px-0">
                      • {point}
                    </Text>
                  ))}
                </Section>
              </>
            )}
            
            <Section className="text-center mt-8 mb-8 mx-0 py-0 px-0 w-full">
              <Button 
                href={videoUrl}
                style={{
                  backgroundColor: "#000000",
                  color: "#ffffff",
                  padding: "16px 40px",
                  borderRadius: "6px",
                  textDecoration: "none",
                  display: "inline-block",
                  fontSize: "16px",
                  fontWeight: "500",
                  fontFamily: '-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,"Helvetica Neue",Ubuntu,sans-serif',
                  letterSpacing: "-0.01em",
                  margin: "0",
                  border: "none",
                  textAlign: "center",
                }}
                className="bg-black rounded-md text-white text-base font-medium no-underline text-center inline-block py-4 px-10 tracking-[-0.01em] m-0 border-none"
              >
                Watch Tutorial
              </Button>
            </Section>
            
            <Section className="border-t border-[#e5e5e5] border-b-0 border-l-0 border-r-0 mt-8 mb-8 mx-0 py-0 px-0 w-full" />
            
            <Text className="text-[#666666] text-sm leading-normal mt-0 mb-2 mx-0">
              Can't view the video? Copy and paste this URL into your browser:
            </Text>
            <Text className="text-black text-sm underline break-all opacity-70 mt-0 mb-0 mx-0">
              {videoUrl}
            </Text>
          </Section>
          
          <Section className="py-8 px-8 border-t border-[#e5e5e5] border-b-0 border-l-0 border-r-0 bg-[#fafafa] w-full">
            <Text className="text-[#666666] text-[13px] leading-normal m-0 text-center">
              © 2025 {companyName}. All rights reserved.
            </Text>
            <Text className="text-[#666666] text-[13px] leading-normal m-0 text-center">
              You're receiving this email because you're a valued customer.
            </Text>
          </Section>
        </Container>
        </div>
      </Tailwind>
    </div>
  );
};

export default EmailTemplate;

