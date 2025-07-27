import React from "react";
import CourseTab from "./CourseTab";

const EditCourse = () => {
  return (
    <div className="flex-1">
      <div className="mb-5">
        <h1 className="font-bold text-xl">
          Add detail information regarding course
        </h1>
      </div>
      <CourseTab/>
    </div>
  );
};

export default EditCourse;
