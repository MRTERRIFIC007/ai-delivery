import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TimeSlotSelector from "./TimeSlotSelector";
import { AddressType } from "../types/order";
import { Package, MapPin, User, Building } from "lucide-react";

interface FormData {
  recipient: {
    name: string;
    phone: string;
    email: string;
  };
  deliveryAddress: {
    street: string;
    city: string;
    state: string;
    postalCode: string;
    country: string;
    location: {
      latitude: number;
      longitude: number;
    };
    addressType: AddressType;
  };
  packageDetails: {
    weight: number;
    dimensions: {
      length: number;
      width: number;
      height: number;
    };
    description: string;
  };
  timeSlot: number;
  timeSlotId?: string;
  customerId: string;
  latitude: string;
  longitude: string;
  addressType: string;
}

const initialFormData: FormData = {
  recipient: {
    name: "",
    phone: "",
    email: "",
  },
  deliveryAddress: {
    street: "",
    city: "",
    state: "",
    postalCode: "",
    country: "India",
    location: {
      latitude: 0,
      longitude: 0,
    },
    addressType: AddressType.RESIDENTIAL,
  },
  packageDetails: {
    weight: 0,
    dimensions: {
      length: 0,
      width: 0,
      height: 0,
    },
    description: "",
  },
  timeSlot: 1,
  customerId: "",
  latitude: "",
  longitude: "",
  addressType: "residential",
};

interface CreateOrderFormProps {
  onSubmit: (orderData: {
    customerId: string;
    latitude: number;
    longitude: number;
    addressType: string;
  }) => void;
  onPredict: (orderData: {
    customerId: string;
    latitude: number;
    longitude: number;
    addressType: string;
  }) => void;
  isLoading?: boolean;
}

const CreateOrderForm: React.FC<CreateOrderFormProps> = ({
  onSubmit,
  onPredict,
  isLoading = false,
}) => {
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [success, setSuccess] = useState<boolean>(false);
  const [selectedTimeSlotId, setSelectedTimeSlotId] = useState<string>("");
  const navigate = useNavigate();

  const handleRecipientChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      recipient: {
        ...formData.recipient,
        [name]: value,
      },
    });
  };

  const handleAddressChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;

    if (name === "addressType") {
      setFormData({
        ...formData,
        deliveryAddress: {
          ...formData.deliveryAddress,
          addressType: parseInt(value, 10) as AddressType,
        },
      });
    } else {
      setFormData({
        ...formData,
        deliveryAddress: {
          ...formData.deliveryAddress,
          [name]: value,
        },
      });
    }
  };

  const handlePackageChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;

    if (name === "weight") {
      setFormData({
        ...formData,
        packageDetails: {
          ...formData.packageDetails,
          weight: parseFloat(value),
        },
      });
    } else if (name === "description") {
      setFormData({
        ...formData,
        packageDetails: {
          ...formData.packageDetails,
          description: value,
        },
      });
    } else if (name.includes("dimensions.")) {
      const dimension = name.split(".")[1];
      setFormData({
        ...formData,
        packageDetails: {
          ...formData.packageDetails,
          dimensions: {
            ...formData.packageDetails.dimensions,
            [dimension]: parseFloat(value),
          },
        },
      });
    }
  };

  const handleTimeSlotSelect = (timeSlot: number, timeSlotId: string) => {
    setFormData({
      ...formData,
      timeSlot,
      timeSlotId,
    });
    setSelectedTimeSlotId(timeSlotId);
  };

  const validateForm = (): boolean => {
    const newErrors: Record<string, string> = {};

    // Validate recipient
    if (!formData.recipient.name) {
      newErrors["recipient.name"] = "Recipient name is required";
    }

    if (!formData.recipient.phone) {
      newErrors["recipient.phone"] = "Recipient phone is required";
    } else if (!/^\d{10}$/.test(formData.recipient.phone)) {
      newErrors["recipient.phone"] = "Phone number must be 10 digits";
    }

    if (
      formData.recipient.email &&
      !/^\S+@\S+\.\S+$/.test(formData.recipient.email)
    ) {
      newErrors["recipient.email"] = "Invalid email address";
    }

    // Validate address
    if (!formData.deliveryAddress.street) {
      newErrors["deliveryAddress.street"] = "Street address is required";
    }

    if (!formData.deliveryAddress.city) {
      newErrors["deliveryAddress.city"] = "City is required";
    }

    if (!formData.deliveryAddress.state) {
      newErrors["deliveryAddress.state"] = "State is required";
    }

    if (!formData.deliveryAddress.postalCode) {
      newErrors["deliveryAddress.postalCode"] = "Postal code is required";
    } else if (!/^\d{6}$/.test(formData.deliveryAddress.postalCode)) {
      newErrors["deliveryAddress.postalCode"] =
        "Indian postal code must be 6 digits";
    }

    // Validate package details
    if (formData.packageDetails.weight <= 0) {
      newErrors["packageDetails.weight"] = "Weight must be greater than 0";
    }

    if (formData.packageDetails.dimensions.length <= 0) {
      newErrors["packageDetails.dimensions.length"] =
        "Length must be greater than 0";
    }

    if (formData.packageDetails.dimensions.width <= 0) {
      newErrors["packageDetails.dimensions.width"] =
        "Width must be greater than 0";
    }

    if (formData.packageDetails.dimensions.height <= 0) {
      newErrors["packageDetails.dimensions.height"] =
        "Height must be greater than 0";
    }

    // Validate time slot
    if (!formData.timeSlotId) {
      newErrors["timeSlot"] = "Please select a delivery time slot";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const response = await fetch(
        `${import.meta.env.VITE_APP_API_URL}/api/orders`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${localStorage.getItem("token")}`,
          },
          body: JSON.stringify(formData),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Failed to create order");
      }

      const data = await response.json();
      setSuccess(true);

      // Reset form
      setFormData(initialFormData);

      // Redirect to order details after successful creation
      setTimeout(() => {
        navigate(`/orders/${data.order._id}`);
      }, 2000);
    } catch (error: any) {
      setErrors({
        submit: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  const handlePredict = () => {
    onPredict({
      customerId: formData.customerId,
      latitude: parseFloat(formData.latitude),
      longitude: parseFloat(formData.longitude),
      addressType: formData.addressType,
    });
  };

  // Simulate getting user's location for the map (in a real app, would use geolocation API)
  useEffect(() => {
    // Default to central Delhi coordinates
    const defaultLat = 28.6139;
    const defaultLng = 77.209;

    setFormData((prev) => ({
      ...prev,
      deliveryAddress: {
        ...prev.deliveryAddress,
        location: {
          latitude: defaultLat,
          longitude: defaultLng,
        },
      },
    }));

    // In a real app, you would use:
    // navigator.geolocation.getCurrentPosition((position) => {
    //   setFormData(prev => ({
    //     ...prev,
    //     deliveryAddress: {
    //       ...prev.deliveryAddress,
    //       location: {
    //         latitude: position.coords.latitude,
    //         longitude: position.coords.longitude,
    //       },
    //     },
    //   }));
    // });
  }, []);

  return (
    <div className="bg-white p-6 rounded-lg shadow-lg">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">
        Create New Delivery Order
      </h2>

      {success && (
        <div className="bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded mb-4">
          Order created successfully! Redirecting...
        </div>
      )}

      {errors.submit && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {errors.submit}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Recipient Information */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Recipient Information
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Name *
              </label>
              <input
                type="text"
                name="name"
                value={formData.recipient.name}
                onChange={handleRecipientChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors["recipient.name"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors["recipient.name"] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors["recipient.name"]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone *
              </label>
              <input
                type="text"
                name="phone"
                value={formData.recipient.phone}
                onChange={handleRecipientChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors["recipient.phone"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors["recipient.phone"] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors["recipient.phone"]}
                </p>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Email (Optional)
              </label>
              <input
                type="email"
                name="email"
                value={formData.recipient.email}
                onChange={handleRecipientChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors["recipient.email"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors["recipient.email"] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors["recipient.email"]}
                </p>
              )}
            </div>
          </div>
        </div>

        {/* Delivery Address */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Delivery Address
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700">
                Street Address *
              </label>
              <input
                type="text"
                name="street"
                value={formData.deliveryAddress.street}
                onChange={handleAddressChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors["deliveryAddress.street"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors["deliveryAddress.street"] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors["deliveryAddress.street"]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                City *
              </label>
              <input
                type="text"
                name="city"
                value={formData.deliveryAddress.city}
                onChange={handleAddressChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors["deliveryAddress.city"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors["deliveryAddress.city"] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors["deliveryAddress.city"]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                State *
              </label>
              <input
                type="text"
                name="state"
                value={formData.deliveryAddress.state}
                onChange={handleAddressChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors["deliveryAddress.state"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors["deliveryAddress.state"] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors["deliveryAddress.state"]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Postal Code *
              </label>
              <input
                type="text"
                name="postalCode"
                value={formData.deliveryAddress.postalCode}
                onChange={handleAddressChange}
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors["deliveryAddress.postalCode"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors["deliveryAddress.postalCode"] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors["deliveryAddress.postalCode"]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Address Type *
              </label>
              <select
                name="addressType"
                value={formData.deliveryAddress.addressType}
                onChange={handleAddressChange}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              >
                <option value={AddressType.RESIDENTIAL}>Residential</option>
                <option value={AddressType.COMMERCIAL}>Commercial</option>
                <option value={AddressType.INDUSTRIAL}>Industrial</option>
              </select>
            </div>
          </div>
        </div>

        {/* Package Details */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Package Details
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Weight (kg) *
              </label>
              <input
                type="number"
                name="weight"
                value={formData.packageDetails.weight || ""}
                onChange={handlePackageChange}
                step="0.01"
                min="0"
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors["packageDetails.weight"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors["packageDetails.weight"] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors["packageDetails.weight"]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Length (cm) *
              </label>
              <input
                type="number"
                name="dimensions.length"
                value={formData.packageDetails.dimensions.length || ""}
                onChange={handlePackageChange}
                step="0.1"
                min="0"
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors["packageDetails.dimensions.length"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors["packageDetails.dimensions.length"] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors["packageDetails.dimensions.length"]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Width (cm) *
              </label>
              <input
                type="number"
                name="dimensions.width"
                value={formData.packageDetails.dimensions.width || ""}
                onChange={handlePackageChange}
                step="0.1"
                min="0"
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors["packageDetails.dimensions.width"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors["packageDetails.dimensions.width"] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors["packageDetails.dimensions.width"]}
                </p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Height (cm) *
              </label>
              <input
                type="number"
                name="dimensions.height"
                value={formData.packageDetails.dimensions.height || ""}
                onChange={handlePackageChange}
                step="0.1"
                min="0"
                className={`mt-1 block w-full px-3 py-2 border ${
                  errors["packageDetails.dimensions.height"]
                    ? "border-red-500"
                    : "border-gray-300"
                } rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500`}
              />
              {errors["packageDetails.dimensions.height"] && (
                <p className="mt-1 text-sm text-red-500">
                  {errors["packageDetails.dimensions.height"]}
                </p>
              )}
            </div>

            <div className="md:col-span-3">
              <label className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                name="description"
                value={formData.packageDetails.description}
                onChange={handlePackageChange}
                rows={3}
                className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-indigo-500 focus:border-indigo-500"
              />
            </div>
          </div>
        </div>

        {/* Time Slot Selection */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Delivery Time Slot *
          </h3>
          <TimeSlotSelector
            selectedArea={formData.deliveryAddress.city || "Delhi"}
            onSelectTimeSlot={handleTimeSlotSelect}
            selectedTimeSlotId={selectedTimeSlotId}
          />
          {errors["timeSlot"] && (
            <p className="mt-1 text-sm text-red-500">{errors["timeSlot"]}</p>
          )}
        </div>

        {/* Customer ID and Location */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Customer ID and Location
          </h3>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label
                htmlFor="customerId"
                className="block text-sm font-medium text-gray-700"
              >
                Customer ID
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <User className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="text"
                  name="customerId"
                  id="customerId"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter customer ID"
                  value={formData.customerId}
                  onChange={(e) =>
                    setFormData({ ...formData, customerId: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="latitude"
                className="block text-sm font-medium text-gray-700"
              >
                Latitude
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  step="any"
                  name="latitude"
                  id="latitude"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter latitude"
                  value={formData.latitude}
                  onChange={(e) =>
                    setFormData({ ...formData, latitude: e.target.value })
                  }
                />
              </div>
            </div>

            <div>
              <label
                htmlFor="longitude"
                className="block text-sm font-medium text-gray-700"
              >
                Longitude
              </label>
              <div className="mt-1 relative rounded-md shadow-sm">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <MapPin className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  step="any"
                  name="longitude"
                  id="longitude"
                  required
                  className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
                  placeholder="Enter longitude"
                  value={formData.longitude}
                  onChange={(e) =>
                    setFormData({ ...formData, longitude: e.target.value })
                  }
                />
              </div>
            </div>
          </div>
        </div>

        {/* Address Type */}
        <div>
          <h3 className="text-lg font-semibold mb-3 text-gray-700">
            Address Type
          </h3>
          <div className="mt-1 relative rounded-md shadow-sm">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Building className="h-5 w-5 text-gray-400" />
            </div>
            <select
              id="addressType"
              name="addressType"
              className="focus:ring-blue-500 focus:border-blue-500 block w-full pl-10 sm:text-sm border-gray-300 rounded-md"
              value={formData.addressType}
              onChange={(e) =>
                setFormData({ ...formData, addressType: e.target.value })
              }
            >
              <option value="residential">Residential</option>
              <option value="commercial">Commercial</option>
              <option value="industrial">Industrial</option>
            </select>
          </div>
        </div>

        {/* Submit Button */}
        <div className="flex space-x-4">
          <button
            type="submit"
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            <Package className="h-4 w-4 mr-2" />
            Create Order
          </button>
          <button
            type="button"
            onClick={handlePredict}
            disabled={isLoading}
            className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
          >
            Predict Time Slot
          </button>
        </div>
      </form>
    </div>
  );
};

export default CreateOrderForm;
